from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.compliance import router as compliance_router
from .routers.dashboard import router as dashboard_router
from .routers.evidence import router as evidence_router
from .routers.inspections import router as inspection_router
from .routers.ocr import router as ocr_router
from .routers.processing import router as processing_router
from .routers.products import router as product_router
from .routers.reports import router as reports_router
from .routers.scanner import router as scanner_router
from .routers.uploads import router as upload_router
from .routers.users import router as users_router
from .routers.violations import router as violations_router

app = FastAPI(
    title="PacksureAI",
    description="AI-powered packaged commodity compliance inspection system",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(product_router)
app.include_router(upload_router)
app.include_router(inspection_router)
app.include_router(evidence_router)
app.include_router(scanner_router)
app.include_router(ocr_router)
app.include_router(compliance_router)
app.include_router(reports_router)
app.include_router(dashboard_router)
app.include_router(violations_router)
app.include_router(users_router)
app.include_router(processing_router)


@app.get("/")
def root():
    return {
        "application": "PacksureAI",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }