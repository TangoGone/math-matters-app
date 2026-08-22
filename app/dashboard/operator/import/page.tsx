"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"

interface ImportSession {
  id: string
  seasonName: string
  importedAt: string
  imported: number
  skipped: number
}

interface DuplicateCandidate {
  row: { name: string; email: string; role: string }
  existing: any
}

export default function ImportPage() {
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState("")
  const [seasonName, setSeasonName] = useState("")
  const [history, setHistory] = useState<ImportSession[]>([])
  const [historyExpanded, setHistoryExpanded] = useState(false)

  // Duplicate detection
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([])
  const [currentDuplicate, setCurrentDuplicate] = useState<DuplicateCandidate | null>(null)
  const [pendingRows, setPendingRows] = useState<any[]>([])
  const [pendingSeasonId, setPendingSeasonId] = useState<string | null>(null)
  const [importStats, setImportStats] = useState({ imported: 0, skipped: 0 })

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    const { data } = await supabase
      .from("seasons")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) {
      setHistory(data.map((s: any) => ({
        id: s.id,
        seasonName: s.name,
        importedAt: s.created_at,
        imported: 0,
        skipped: 0,
      })))
    }
  }

  function parseCSV(text: string) {
    const lines = text.trim().split("\n")
    const firstLine = lines[0].split(",").map(h => h.trim().toLowerCase())
    const hasHeaders = firstLine.some(h => ["name", "email", "role", "full_name"].includes(h))

    if (hasHeaders) {
      const headers = firstLine
      return lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim())
        const row: any = {}
        headers.forEach((h, i) => { row[h] = values[i] || "" })
        return row
      })
    } else {
      return lines.map(line => {
        const values = line.split(",").map(v => v.trim())
        return { name: values[0] || "", email: values[1] || "", role: values[2] || "" }
      })
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError("")

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)
      setPreview(rows.slice(0, 5))
    }
    reader.readAsText(f)
  }

  async function handleImport() {
    if (!file || !seasonName.trim()) {
      setError("Please select a file and enter a season name.")
      return
    }
    setImporting(true)
    setError("")

    const { data: season, error: seasonError } = await supabase
      .from("seasons")
      .insert({ name: seasonName })
      .select()
      .single()

    if (seasonError || !season) {
      setError("Failed to create season.")
      setImporting(false)
      return
    }

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)

      // Check for duplicates first
      const dupes: DuplicateCandidate[] = []
      const cleanRows: any[] = []

      for (const row of rows) {
        const name = row["name"] || row["full_name"] || row["fullname"]
        const email = row["email"] || ""
        if (!name) continue

        const { data: existing } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, approval_status")
          .or(`full_name.ilike.${name},email.eq.${email}`)
          .maybeSingle()

        if (existing) {
          dupes.push({ row: { name, email, role: row["role"] || "" }, existing })
        } else {
          cleanRows.push(row)
        }
      }

      setPendingRows(cleanRows)
      setPendingSeasonId(season.id)
      setImportStats({ imported: 0, skipped: 0 })

      if (dupes.length > 0) {
        setDuplicates(dupes)
        setCurrentDuplicate(dupes[0])
        setImporting(false)
      } else {
        await processRows(cleanRows, season.id, 0, 0)
      }
    }
    reader.readAsText(file)
  }

  async function processRows(rows: any[], seasonId: string, imported: number, skipped: number) {
    for (const row of rows) {
      const name = row["name"] || row["full_name"] || row["fullname"]
      const email = row["email"] || ""
      const role = row["role"] || null

      if (!name) { skipped++; continue }

      const { error } = await supabase
        .from("profiles")
        .insert({
          full_name: name,
          email: email || null,
          role: role || null,
          season_id: seasonId,
          approval_status: "unclaimed",
        })

      if (error) { skipped++ } else { imported++ }
    }

    setResult({ imported, skipped })
    setImporting(false)
    await loadHistory()
  }

  async function handleDuplicateDecision(skip: boolean) {
    const remaining = duplicates.slice(1)

    if (!skip && currentDuplicate && pendingSeasonId) {
      // Add to pending rows to import anyway
      setPendingRows(prev => [...prev, {
        name: currentDuplicate.row.name,
        email: currentDuplicate.row.email,
        role: currentDuplicate.row.role,
      }])
    }

    if (remaining.length > 0) {
      setDuplicates(remaining)
      setCurrentDuplicate(remaining[0])
    } else {
      setCurrentDuplicate(null)
      setDuplicates([])
      setImporting(true)
      const finalRows = skip
        ? pendingRows
        : [...pendingRows, {
            name: currentDuplicate!.row.name,
            email: currentDuplicate!.row.email,
            role: currentDuplicate!.row.role,
          }]
      await processRows(finalRows, pendingSeasonId!, 0, 0)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Import Roster</h2>
        <p className="text-muted-foreground mt-1">Upload a CSV file to seed profiles for a new season</p>
      </div>

      {/* Format guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV Format</CardTitle>
          <CardDescription>
            Your CSV file should have these columns — extra columns are ignored
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-md p-3 font-mono text-sm text-foreground">
            name, email, role
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Role must be one of: <code>student</code>, <code>tutor</code>, <code>codirector</code>, <code>operator</code>. Leave blank if unknown.
            Header row is optional — if missing, columns are assumed to be name, email, role in that order.
          </p>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Season name</label>
            <input
              type="text"
              placeholder="e.g. Fall 2025"
              value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">CSV file</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90"
            />
          </div>

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Preview (first 5 rows)</p>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      {Object.keys(preview[0]).map(k => (
                        <th key={k} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground border-b border-border">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-3 py-2 text-foreground">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-md px-4 py-3">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-500">Import complete</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {result.imported} profiles imported, {result.skipped} skipped
                </p>
              </div>
            </div>
          )}

          <Button onClick={handleImport} disabled={!file || importing} className="w-full">
            {importing ? (
              <><Upload className="w-4 h-4 mr-2 animate-bounce" />Importing...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />Import Roster</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import history */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setHistoryExpanded(!historyExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <CardTitle className="text-base">Import History ({history.length})</CardTitle>
              {historyExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
          </CardHeader>
          {historyExpanded && (
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-muted/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{h.seasonName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(h.importedAt).toLocaleDateString("en-US", {
                          month: "long", day: "numeric", year: "numeric"
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary">Season</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Duplicate dialog */}
      <Dialog open={!!currentDuplicate} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Profile Found</DialogTitle>
            <DialogDescription>
              A profile already exists that matches this import entry.
            </DialogDescription>
          </DialogHeader>

          {currentDuplicate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Importing</p>
                  <p className="text-sm font-medium text-foreground">{currentDuplicate.row.name}</p>
                  <p className="text-xs text-muted-foreground">{currentDuplicate.row.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{currentDuplicate.row.role || "No role"}</p>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Existing</p>
                  <p className="text-sm font-medium text-foreground">{currentDuplicate.existing.full_name}</p>
                  <p className="text-xs text-muted-foreground">{currentDuplicate.existing.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{currentDuplicate.existing.role || "No role"}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Do you want to import this as a new profile anyway, or skip it?
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleDuplicateDecision(true)}>
              Skip
            </Button>
            <Button onClick={() => handleDuplicateDecision(false)}>
              Import Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}