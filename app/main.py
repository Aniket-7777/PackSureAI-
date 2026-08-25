import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.api.routes import router as api_router

app = FastAPI(
    title="Packaged Commodity Legal Metrology Compliance Engine",
    description="Backend API & Frontend Dashboard for AI-based label declaration checking under Legal Metrology Rules, 2011.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static & templates directories exist
os.makedirs("app/static", exist_ok=True)
os.makedirs("app/templates", exist_ok=True)

# Static files and Jinja2 templates mounting
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# Include API Router
app.include_router(api_router, prefix="/api/v1")

# Serve UI on root
@app.get("/", tags=["Dashboard UI"])
def serve_dashboard(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )