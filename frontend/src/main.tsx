import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectPage from "./pages/ProjectPage";
import EditorPage from "./pages/EditorPage";
import ExportPage from "./pages/ExportPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects/new" element={<NewProjectPage />} />
          <Route path="/projects/:id" element={<ProjectPage />} />
          <Route path="/projects/:id/editor" element={<EditorPage />} />
          <Route path="/projects/:id/export" element={<ExportPage />} />
          <Route
            path="*"
            element={
              <div className="rounded-2xl border border-zinc-200 bg-white/60 p-5 text-sm text-zinc-700">
                Page introuvable.
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);

