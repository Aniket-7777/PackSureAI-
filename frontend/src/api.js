const API_BASE_URL = "http://127.0.0.1:8000";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : {
            "Content-Type": "application/json",
          }),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data?.detail
        ? data.detail
        : "API request failed";

    throw new Error(message);
  }

  return data;
}

/* =========================================================
   PRODUCTS
========================================================= */

export async function getProducts() {
  return apiRequest("/api/products/");
}

export async function getProductByBarcode(barcode) {
  const result = await apiRequest(
    `/api/products/barcode/${encodeURIComponent(barcode)}`
  );

  return result?.data ?? null;
}

export async function getProduct(productId) {
  return apiRequest(`/api/products/${productId}`);
}

export async function createProduct(product) {
  return apiRequest("/api/products/", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateProduct(productId, data) {
  return apiRequest(`/api/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(productId) {
  return apiRequest(`/api/products/${productId}`, {
    method: "DELETE",
  });
}

/* =========================================================
   INSPECTIONS
========================================================= */

export async function createInspection(data) {
  return apiRequest("/api/inspections/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getInspections(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.set(key, value);
    }
  });

  const suffix = query.toString()
    ? `?${query.toString()}`
    : "";

  return apiRequest(`/api/inspections/${suffix}`);
}

export async function getInspection(inspectionId) {
  return apiRequest(`/api/inspections/${inspectionId}`);
}

export async function getInspectionByBarcode(barcode) {
  return apiRequest(
    `/api/inspections/barcode/${encodeURIComponent(barcode)}`
  );
}

export async function getInspectionByNumber(
  inspectionNumber
) {
  return apiRequest(
    `/api/inspections/number/${encodeURIComponent(
      inspectionNumber
    )}`
  );
}

export async function updateInspection(
  inspectionId,
  data
) {
  return apiRequest(`/api/inspections/${inspectionId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteInspection(inspectionId) {
  return apiRequest(`/api/inspections/${inspectionId}`, {
    method: "DELETE",
  });
}

export async function getInspectionStatus(
  inspectionId
) {
  return apiRequest(
    `/api/inspections/${inspectionId}/status`
  );
}

export async function startInspection(inspectionId) {
  return apiRequest(
    `/api/inspections/${inspectionId}/start`,
    {
      method: "PATCH",
    }
  );
}

export async function completeInspection(
  inspectionId
) {
  return apiRequest(
    `/api/inspections/${inspectionId}/complete`,
    {
      method: "PATCH",
    }
  );
}

export async function failInspection(inspectionId) {
  return apiRequest(
    `/api/inspections/${inspectionId}/fail`,
    {
      method: "PATCH",
    }
  );
}

export async function markInspectionReviewRequired(
  inspectionId
) {
  return apiRequest(
    `/api/inspections/${inspectionId}/review-required`,
    {
      method: "PATCH",
    }
  );
}

/* =========================================================
   EVIDENCE
========================================================= */

export async function uploadEvidence({
  inspectionId,
  imageType,
  file,
}) {
  const formData = new FormData();

  formData.append("inspection_id", inspectionId);
  formData.append("image_type", imageType);
  formData.append("file", file);

  return apiRequest("/api/evidence/upload", {
    method: "POST",
    body: formData,
  });
}

export async function getEvidence(inspectionId) {
  return apiRequest(`/api/evidence/${inspectionId}`);
}

export async function getEvidenceSummary(
  inspectionId
) {
  return apiRequest(
    `/api/evidence/${inspectionId}/summary`
  );
}

export async function getEvidenceImage(imageId) {
  return apiRequest(
    `/api/evidence/image/${imageId}`
  );
}

export async function deleteEvidence(evidenceId) {
  return apiRequest(`/api/evidence/${evidenceId}`, {
    method: "DELETE",
  });
}

/* =========================================================
   SCANNER
========================================================= */

export async function lookupBarcode(barcode) {
  return apiRequest(
    `/api/scanner/${encodeURIComponent(barcode)}`
  );
}

export async function scannerLookup(barcode) {
  return apiRequest("/api/scanner/lookup", {
    method: "POST",
    body: JSON.stringify({
      barcode,
    }),
  });
}

/* =========================================================
   OCR
========================================================= */

export async function processOCR(inspectionId) {
  return apiRequest(
    `/api/ocr/process/${inspectionId}`,
    {
      method: "POST",
    }
  );
}

/* =========================================================
   COMPLIANCE
========================================================= */

export async function getComplianceRules() {
  return apiRequest("/api/compliance/rules");
}

export async function getComplianceRule(ruleCode) {
  return apiRequest(
    `/api/compliance/rules/${encodeURIComponent(ruleCode)}`
  );
}

export async function getComplianceResults(
  inspectionId
) {
  return apiRequest(
    `/api/compliance/inspection/${inspectionId}`
  );
}

export async function runCompliance(inspectionId) {
  return apiRequest(
    `/api/compliance/run/${inspectionId}`,
    {
      method: "POST",
    }
  );
}

/* =========================================================
   VIOLATIONS
========================================================= */

export async function getInspectionViolations(
  inspectionId
) {
  return apiRequest(
    `/api/violations/inspection/${inspectionId}`
  );
}

export async function getViolation(violationId) {
  return apiRequest(
    `/api/violations/${violationId}`
  );
}

export async function resolveViolation(
  violationId,
  data = {}
) {
  return apiRequest(
    `/api/violations/${violationId}/resolve`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function unresolveViolation(
  violationId
) {
  return apiRequest(
    `/api/violations/${violationId}/unresolve`,
    {
      method: "PATCH",
    }
  );
}

export async function getUnresolvedViolations(
  limit = 50
) {
  return apiRequest(
    `/api/violations/unresolved/all?limit=${limit}`
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

export async function getDashboardOverview() {
  return apiRequest("/api/dashboard/overview");
}

export async function getRecentInspections(
  params = {}
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.set(key, value);
    }
  });

  const suffix = query.toString()
    ? `?${query.toString()}`
    : "";

  return apiRequest(
    `/api/dashboard/recent-inspections${suffix}`
  );
}

export async function getDashboardViolations(
  params = {}
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.set(key, value);
    }
  });

  const suffix = query.toString()
    ? `?${query.toString()}`
    : "";

  return apiRequest(
    `/api/dashboard/violations${suffix}`
  );
}

export async function getComplianceDistribution() {
  return apiRequest(
    "/api/dashboard/compliance-distribution"
  );
}

/* =========================================================
   REPORTS
========================================================= */

export async function getInspectionReport(
  inspectionId
) {
  return apiRequest(
    `/api/reports/${inspectionId}`
  );
}

export async function getInspectionReportSummary(
  inspectionId
) {
  return apiRequest(
    `/api/reports/${inspectionId}/summary`
  );
}

export function getInspectionReportPdfUrl(
  inspectionId
) {
  return `${API_BASE_URL}/api/reports/${inspectionId}/pdf`;
}

export async function downloadInspectionReport(
  inspectionId
) {
  const response = await fetch(
    getInspectionReportPdfUrl(inspectionId)
  );

  if (!response.ok) {
    throw new Error("Failed to download report");
  }

  return response.blob();
}

/* =========================================================
   USERS
========================================================= */

export async function getUsers() {
  return apiRequest("/api/users/");
}

export async function getUser(userId) {
  return apiRequest(`/api/users/${userId}`);
}

export async function getUserPermissions(userId) {
  return apiRequest(
    `/api/users/${userId}/permissions`
  );
}

/* =========================================================
   PROCESSING
========================================================= */

export async function processInspection(
  inspectionId
) {
  return apiRequest(
    `/api/processing/${inspectionId}/run`,
    {
      method: "POST",
    }
  );
}

/* =========================================================
   HEALTH
========================================================= */

export async function checkBackendHealth() {
  return apiRequest("/health");
}