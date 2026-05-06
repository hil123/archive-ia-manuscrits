export type ID = string;
export type ISODateString = string;

export type ConfidenceLevel = "low" | "medium" | "high";

export type LineStatus = "pending" | "corrected" | "validated";

export type User = {
  id: ID;
  email?: string;
  displayName?: string;
  createdAt: ISODateString;
};

export type Project = {
  id: ID;
  title: string;
  description?: string;
  status: "draft" | "active" | "archived";
  createdAt: ISODateString;
  documents: Document[];
};

export type Document = {
  id: ID;
  projectId: ID;
  fileName: string;
  fileType: string; // mime type
  pageCount: number;
  pages: Page[];
};

export type Page = {
  id: ID;
  documentId: ID;
  pageNumber: number; // 1-based
  imageUrl?: string;
};

export type Correction = {
  id: ID;
  lineId: ID;
  text: string;
  createdAt: ISODateString;
};

export type Line = {
  id: ID;
  pageId: ID;
  lineNumber: number; // 1-based
  ocrRaw: string;
  aiSuggestion: string;
  humanCorrection: string;
  finalText: string;
  confidenceScore: number; // 0..1
  confidenceLevel: ConfidenceLevel;
  status: LineStatus;
};

