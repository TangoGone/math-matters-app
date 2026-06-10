"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ImportPage() {
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState("")
  const [seasonName, setSeasonName] = useState("")

  function parseCSV(text: string) {
    const lines = text.trim().split("\n")
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase())
    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim())
      const row: any = {}
      headers.forEach((h, i) => { row[h] = values[i] || "" })
      return row
    })
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

    // Create season
    const { data: season } = await supabase
      .from("seasons")
      .insert({ name: seasonName })
      .select()
      .single()

    if (!season) {
      setError("Failed to create season.")
      setImporting(false)
      return
    }

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)

      let imported = 0
      let skipped = 0

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
            season_id: season.id,
            approval_status: "unclaimed",
          })

        if (error) { skipped++ } else { imported++ }
      }

      setResult({ imported, skipped })
      setImporting(false)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import Roster</h2>
        <p className="text-gray-500 mt-1">Upload a CSV file to seed profiles for a new season</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV Format</CardTitle>
          <CardDescription>
            Your CSV file should have these columns — extra columns are ignored
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 font-mono text-sm text-gray-700 dark:text-gray-300">
            name, email, role
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Role must be one of: <code>student</code>, <code>tutor</code>, <code>codirector</code>, <code>operator</code>. Leave blank if unknown.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Season name
            </label>
            <input
              type="text"
              placeholder="e.g. Fall 2025"
              value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              CSV file
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300"
            />
          </div>

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview (first 5 rows)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900">
                      {Object.keys(preview[0]).map(k => (
                        <th key={k} className="px-3 py-2 text-left text-xs font-medium text-gray-500 border border-gray-200 dark:border-gray-700">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
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
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md px-4 py-3">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Import complete
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                {result.imported} profiles imported, {result.skipped} skipped
              </p>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? "Importing..." : "Import Roster"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}