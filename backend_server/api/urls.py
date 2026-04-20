from django.urls import path
from .views import ExplainView, UploadPdfView

urlpatterns = [
    path("upload-pdf/", UploadPdfView.as_view(), name="upload_pdf"),
    path("explain/", ExplainView.as_view(), name="explain"),
]
