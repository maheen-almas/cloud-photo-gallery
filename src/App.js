import React, { useState, useEffect, useCallback } from "react";
import { post, get } from "aws-amplify/api";

function App({ signOut, user }) {
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const userId = user.userId;

  const loadPhotos = useCallback(async () => {
    try {
      const response = await get({
        apiName: "PhotoGalleryAPI",
        path: `/listPhotos?userId=${userId}`,
      }).response;

      const data = await response.body.json();
      setPhotos(data);
    } catch (err) {
      console.error("Error loading photos:", err);
    }
  }, [userId]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  async function handleUpload() {
    if (!file) {
      setMessage("Please select an image first");
      return;
    }

    setUploading(true);
    setMessage("Getting upload URL...");

    try {
      const urlResponse = await post({
        apiName: "PhotoGalleryAPI",
        path: "/getUploadUrl",
        options: {
          body: {
            userId: userId,
            fileName: file.name,
            contentType: file.type,
          },
        },
      }).response;

      const { url, key } = await urlResponse.body.json();

      setMessage("Uploading to S3...");
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      setMessage("Saving metadata...");
      await post({
        apiName: "PhotoGalleryAPI",
        path: "/confirmUpload",
        options: {
          body: {
            userId: userId,
            key: key,
            caption: "",
            size: file.size,
          },
        },
      }).response;

      setMessage("Upload successful!");
      setFile(null);
      loadPhotos();
    } catch (err) {
      console.error(err);
      setMessage("Upload failed. Check console.");
    }

    setUploading(false);
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Cloud Photo Gallery</h1>
          <p style={styles.subtitle}>
            Logged in as: <strong>{user.signInDetails?.loginId || user.userId}</strong>
          </p>
        </div>
        <button onClick={signOut} style={styles.signOutBtn}>
          Sign Out
        </button>
      </header>

      {/* Upload Section */}
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Upload New Photo</h2>

        <div style={styles.uploadArea}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={styles.fileInput}
          />

          {file && (
            <p style={styles.fileName}>Selected: {file.name}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              ...styles.uploadBtn,
              opacity: uploading ? 0.7 : 1,
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>

          {message && (
            <p style={{
              ...styles.message,
              color: message.includes("successful") ? "#10b981" : "#ef4444"
            }}>
              {message}
            </p>
          )}
        </div>
      </section>

      {/* Gallery Section */}
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>My Photos ({photos.length})</h2>

        {photos.length === 0 ? (
          <p style={styles.emptyText}>No photos uploaded yet.</p>
        ) : (
          <div style={styles.gallery}>
            {photos.map((photo) => (
              <div key={photo.photoId} style={styles.photoCard}>
                <div style={styles.photoPlaceholder}>
                  <span style={{ fontSize: "32px" }}>🖼️</span>
                </div>
                <div style={styles.photoInfo}>
                  <p style={styles.photoKey}>{photo.photoId.split("/").pop()}</p>
                  <p style={styles.photoMeta}>
                    {(photo.size / 1024).toFixed(1)} KB •{" "}
                    {new Date(Number(photo.uploadedAt)).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Modern styling
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "24px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  subtitle: {
    color: "#64748b",
    margin: "4px 0 0 0",
    fontSize: "14px",
  },
  signOutBtn: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: "500",
    cursor: "pointer",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "28px",
    marginBottom: "24px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a",
    marginTop: 0,
    marginBottom: "20px",
  },
  uploadArea: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fileInput: {
    padding: "12px",
    border: "2px dashed #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#f8fafc",
  },
  fileName: {
    color: "#475569",
    fontSize: "14px",
    margin: 0,
  },
  uploadBtn: {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    padding: "14px 24px",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "16px",
    width: "fit-content",
  },
  message: {
    fontWeight: "500",
    margin: 0,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    padding: "40px 0",
  },
  gallery: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
  },
  photoCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  photoPlaceholder: {
    height: "160px",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  photoInfo: {
    padding: "14px",
  },
  photoKey: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    margin: "0 0 6px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  photoMeta: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
  },
};

export default App;