"use client";

import jsPDF from "jspdf";
import { useState } from "react";
import axios from "axios";
import useSWR from "swr";
import { AppLayout } from "@/components/layout/app-layout";

type CSVRow = string[];
type Classification = Record<string, string>;
type Plots = Record<string, string>;

export default function StatsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [tableData, setTableData] = useState<CSVRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [statsData, setStatsData] = useState<any>({});
  const [plots, setPlots] = useState<Plots>({});
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [rawPatientNames, setRawPatientNames] = useState<string[]>([]);
  const [pdfName, setPdfName] = useState("");
  const [classificationResults, setClassificationResults] = useState<Classification[]>([]);
  const [rawCsvColumns, setRawCsvColumns] = useState<string[]>([]);
  const [rawCsvData, setRawCsvData] = useState<CSVRow[]>([]);
  const [loading, setLoading] = useState(false);

  // -------------------------
  // FILE UPLOAD
  // -------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    setFile(uploaded);

    const text = await uploaded.text();
    const rows = text
      .split("\n")
      .filter(Boolean)
      .map((row: string) => row.split(","));

    setRawCsvColumns(rows[0]);
    setRawCsvData(rows.slice(1));
    setRawPatientNames(rows.slice(1).map((row: CSVRow) => row[0]));
    setPdfName(uploaded.name);
    setColumns(rows[0]);
    setTableData(rows.slice(1));
    setSelectedPatient(0);
  };

  // -------------------------
  // PROCESS CSV (CALL BACKEND)
  // -------------------------
  const handleProcess = async () => {
    if (!file) return alert("Upload CSV first");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("http://127.0.0.1:8000/classify", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const data = response.data;

      setStatsData(data.stats || {});
      setPlots(data.plots || {});
      setColumns(data.table?.columns || []);
      setTableData(data.table?.values || []);

      const conditionCols = ["Diabetes", "Obesity", "Cancer", "Asthma", "Hypertension", "Arthritis"];
      const allClassifications = (data.table?.values || []).map((row: CSVRow) => {
        const patientClassification: Classification = {};
        conditionCols.forEach((col) => {
          const idx = data.table.columns.indexOf(col);
          const value = idx !== -1 && row[idx] != null ? String(row[idx]).trim().toLowerCase() : "";
          patientClassification[col] = ["yes", "high", "1"].includes(value) ? "Élevé" : "Stable";
        });
        return patientClassification;
      });
      setClassificationResults(allClassifications);
      setSelectedPatient(0);
    } catch (err) {
      console.error(err);
      alert("Error processing CSV");
    }
    setLoading(false);
  };

  // -------------------------
  // PDF EXPORT
  // -------------------------
  const downloadPDF = () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();

      pdf.setFontSize(20);
      pdf.text("🩺 Rapport Patient – MyClinic", 10, 15);
      pdf.setFontSize(12);
      pdf.text(`Fichier Importé : ${pdfName}`, 10, 25);
      pdf.text(`Date : ${new Date().toLocaleString()}`, 10, 32);

      let y = 42;
      pdf.setFontSize(16);
      pdf.text("📄 Données Originales du Fichier CSV", 10, y);
      y += 8;
      pdf.setFontSize(10);

      rawCsvColumns.forEach((col, idx) => pdf.text(col, 10 + idx * 40, y));
      y += 6;

      rawCsvData.forEach((row) => {
        row.forEach((cell, idx) => pdf.text(String(cell), 10 + idx * 40, y));
        y += 6;
        if (y > 270) {
          pdf.addPage();
          y = 15;
        }
      });

      pdf.addPage();
      y = 15;
      pdf.setFontSize(16);
      pdf.text("📊 Visualisations", 10, y);
      y += 10;

      Object.entries(plots).forEach(([plotName, base64]) => {
        pdf.setFontSize(12);
        pdf.text(plotName, 10, y);
        y += 5;
        if (typeof base64 === "string") {
          pdf.addImage(`data:image/png;base64,${base64}`, "PNG", 10, y, pageWidth - 20, 80);
          y += 90;
        }
        if (y > 260) {
          pdf.addPage();
          y = 15;
        }
      });

      pdf.save("PatientDashboard.pdf");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du PDF");
    }
  };

  // -------------------------
  // SWR FETCH
  // -------------------------
  const fetcher = (url: string) => axios.get(url).then((res) => res.data);
  const { data: stats, isLoading: statsLoading } = useSWR("/api/stats", fetcher);

  // -------------------------
  // MODERN PAGE RENDER
  // -------------------------
  return (
    <AppLayout title="Visualisation des Statistiques" description="Analyse des données patients et classification des Maladies">
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-green-900 mb-3">🩺 Visualisation Des Statistiques</h1>
          <p className="text-green-700 text-lg">Analyse des données patients et classification des Maladies</p>
        </div>

        {/* File Upload & Actions */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white bg-opacity-80 backdrop-blur-md rounded-3xl shadow-2xl p-6 max-w-4xl mx-auto mb-10 transition hover:shadow-3xl">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />
          <button
            onClick={handleProcess}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold rounded-xl shadow-lg hover:from-green-600 hover:to-green-800 transition"
          >
            Analyze
          </button>
          <button
            onClick={downloadPDF}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-800 transition"
          >
            Download PDF
          </button>
        </div>

        {loading && <p className="text-center text-green-800 font-medium animate-pulse mb-6">⏳ Classification en cours...</p>}

        {/* Dashboard */}
        <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">
          {/* Sidebar */}
          {rawPatientNames.length > 0 && (
            <aside className="w-full md:w-64 bg-white bg-opacity-80 backdrop-blur-md p-6 rounded-2xl shadow-xl h-[500px] overflow-y-auto">
              <h3 className="text-green-800 font-bold mb-4 text-lg">Liste des Patients</h3>
              <ul className="space-y-2">
                {rawPatientNames.map((name, index) => (
                  <li
                    key={index}
                    onClick={() => setSelectedPatient(index)}
                    className={`cursor-pointer p-3 rounded-xl transition ${
                      selectedPatient === index
                        ? "bg-green-200 font-semibold shadow-inner"
                        : "hover:bg-green-100"
                    }`}
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {/* Patient Info + Classification */}
          {selectedPatient !== null && rawCsvData[selectedPatient] && (
            <section className="flex-1 bg-white bg-opacity-80 backdrop-blur-md p-6 rounded-3xl shadow-2xl space-y-6">
              <h2 className="text-green-800 font-bold text-2xl">Patient Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rawCsvColumns.map((col, i) => (
                  <div
                    key={i}
                    className="bg-green-50 p-4 border-l-4 border-green-400 rounded-xl shadow-sm hover:shadow-md transition"
                  >
                    <strong>{col}:</strong> {rawCsvData[selectedPatient][i]}
                  </div>
                ))}
              </div>

              {/* Classification Results */}
              {classificationResults[selectedPatient] && (
                <div className="bg-green-100 p-4 rounded-2xl shadow-inner">
                  <h3 className="text-green-800 font-semibold mb-2">Résultats de classification</h3>
                  <ul className="list-disc pl-6 text-green-900 space-y-1">
                    {Object.entries(classificationResults[selectedPatient]).map(([condition, status], i) => (
                      <li key={i}>
                        {condition} -{" "}
                        <span className={`${status === "Élevé" ? "text-red-600 font-bold" : "text-green-700"}`}>
                          {status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Plots Section */}
        {Object.keys(plots).length > 0 && (
          <div className="mt-12 bg-white bg-opacity-80 backdrop-blur-md p-6 rounded-3xl shadow-2xl max-w-6xl mx-auto">
            <h3 className="text-green-800 font-bold text-2xl mb-6">Visualisations Globales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(plots).map(([key, value], i) => (
                <div
                  key={i}
                  className="bg-green-50 bg-opacity-50 p-4 rounded-2xl shadow hover:shadow-lg transition text-center"
                >
                  <h4 className="font-medium text-green-800 mb-3">{key}</h4>
                  <img
                    src={`data:image/png;base64,${value}`}
                    alt={key}
                    className="w-full max-h-64 object-contain rounded-lg border"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
