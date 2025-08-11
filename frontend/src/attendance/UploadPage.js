import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import { BASE_URL } from "../services/api";
import axios from "axios";

export default function UploadPage() {
  const [image, setImage] = useState(null);
  const [programCode, setProgramCode] = useState("");
  const [year, setYear] = useState(""); 
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!image) {
      alert("Please select an image.");
      return;
    }

    
    if (year && (!/^\d{4}$/.test(year) || parseInt(year) < 1900 || parseInt(year) > 2100)) {
      alert("Please enter a valid 4-digit year.");
      return;
    }

    const colid = localStorage.getItem("colid");
    console.log("colid:", colid);

    const fd = new FormData();
    fd.append("image", image);
    fd.append("colid", colid);
    fd.append("program_code", programCode);
    fd.append("year", year); 

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(`${BASE_URL}api/attendance_upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      console.log("Upload result:", res.data);
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <UploadPageContainer>
      <UploadCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <UploadTitle>Upload Group Photo</UploadTitle>

        {/* Image Input */}
        <UploadInputContainer>
          <UploadInputLabel disabled={loading}>
            {image ? image.name : "Choose an image"}
            <UploadInput
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              disabled={loading}
            />
          </UploadInputLabel>
        </UploadInputContainer>

        {/* Program Code Input */}
        <UploadInputContainer>
          <UploadInputLabel as="div">
            <input
              type="text"
              placeholder="Enter Program Code"
              value={programCode}
              onChange={(e) => setProgramCode(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "0rem",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                backgroundColor: "transparent",
                outline: "none",
                fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
              }}
            />
          </UploadInputLabel>
        </UploadInputContainer>

        {/* New Year Input */}
        <UploadInputContainer>
          <UploadInputLabel as="div">
            <input
              type="text"
              placeholder="Enter Year (e.g., 2024)"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "0rem",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                backgroundColor: "transparent",
                outline: "none",
                fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
              }}
              maxLength={4}
            />
          </UploadInputLabel>
        </UploadInputContainer>

        {/* Upload Button */}
        <UploadButton
          onClick={submit}
          disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
        >
          {loading && <LoadingSpinner />}
          {loading ? "Processing..." : "Upload"}
        </UploadButton>

        {/* Loading & Result UI */}
        {loading && <LoadingText>Detecting faces, please wait...</LoadingText>}

        {result && !loading && (
          <ResultContainer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ResultText>
              <StrongText>Total Faces Detected:</StrongText> {result.total}
            </ResultText>
            <ResultText>
              <StrongText>Unknown Faces:</StrongText> {result.unknown}
            </ResultText>

            <ResultTitle>Present Students</ResultTitle>
            {result.present.length === 0 ? (
              <NoKnownText>No known faces found</NoKnownText>
            ) : (
              <PresentList>
                {result.present.map((name, idx) => (
                  <PresentItem key={idx}>{name}</PresentItem>
                ))}
              </PresentList>
            )}
          </ResultContainer>
        )}
      </UploadCard>
    </UploadPageContainer>
  );
}
