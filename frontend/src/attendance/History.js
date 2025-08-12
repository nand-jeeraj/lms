import React, { useEffect, useState } from "react";
import axios from "axios";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import { BASE_URL } from "../services/api";
import { formatInTimeZone } from "date-fns-tz";

// Loading animation keyframes
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Card = styled(motion.div)`
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h2`
  color: #2b6cb0;
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
`;

const EmptyState = styled.p`
  color: #718096;
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const TableHeader = styled.thead`
  background-color: #ebf8ff;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f7fafc;
  }
  &:hover {
    background-color: #ebf8ff;
  }
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  color: #2d3748;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
`;

const TableCell = styled.td`
  padding: 1rem;
  color: #4a5568;
  border-bottom: 1px solid #e2e8f0;
`;

const TimestampCell = styled(TableCell)`
  white-space: nowrap;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(66, 153, 225, 0.2);
  border-radius: 50%;
  border-top-color: #4299e1;
  animation: ${spin} 1s ease-in-out infinite;
  margin: 2rem auto;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
`;

const Input = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  flex: 1;
  min-width: 150px;
  font-size: 1rem;
`;

const Button = styled.button`
  background-color: #2b6cb0;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  align-self: center;
  font-weight: 600;

  &:hover {
    background-color: #2c5282;
  }
`;

const IST_TIMEZONE = "Asia/Kolkata";

function formatToIST(timestamp) {
  if (!timestamp) return "-";
  try {
    const date = new Date(timestamp);
    // formatInTimeZone formats the date directly in the timezone without needing a separate conversion
    return formatInTimeZone(date, IST_TIMEZONE, "yyyy-MM-dd HH:mm:ss 'IST'");
  } catch (err) {
    console.error("Date formatting error:", err);
    return "-";
  }
}



export default function History() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    colid: localStorage.getItem("colid") || "",
    program_code: "",
    year: "",
    course_code: "",
    name: "",
  });

  // Fetch history with filters
  const fetchHistory = () => {
    setIsLoading(true);

    // Remove empty filters to avoid sending empty strings
    const params = {};
    Object.entries(filters).forEach(([key, val]) => {
      if (val && val.trim() !== "") {
        params[key] = val.trim();
      }
    });

    axios
      .get(`${BASE_URL}api/attendance_history`, { params })
      .then((res) => {
        setRecords(res.data);
      })
      .catch((err) => {
        console.error("Failed to load history", err);
        setRecords([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // On first mount, fetch with default colid filter
  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle input change for filters
  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container>
      <Card initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Title>Attendance History</Title>

        {/* Filters */}
        <FilterSection>
          <Input
            type="text"
            placeholder="College ID"
            name="colid"
            value={filters.colid}
            onChange={handleChange}
          />
          <Input
            type="text"
            placeholder="Program Code"
            name="program_code"
            value={filters.program_code}
            onChange={handleChange}
          />
          <Input
            type="text"
            placeholder="Year"
            name="year"
            value={filters.year}
            onChange={handleChange}
          />

          <Input
            type="text"
            placeholder="Student Name"
            name="name"
            value={filters.name}
            onChange={handleChange}
          />
          <Button onClick={fetchHistory}>Apply Filters</Button>
        </FilterSection>

        {/* Data Table */}
        {isLoading ? (
          <LoadingSpinner />
        ) : records.length === 0 ? (
          <EmptyState>No attendance records found.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Student</TableHeaderCell>
                <TableHeaderCell>Timestamp</TableHeaderCell>
                <TableHeaderCell>Program Code</TableHeaderCell>
                <TableHeaderCell>Year</TableHeaderCell>
                <TableHeaderCell>College ID</TableHeaderCell>
              </tr>
            </TableHeader>
            <tbody>
              {records.map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell>{r.name || r.Student_name || "-"}</TableCell>
                  <TimestampCell>{formatToIST(r.timestamp)}</TimestampCell>
                  <TableCell>{r.programcode || "-"}</TableCell>
                  <TableCell>{r.year || "-"}</TableCell>
                  <TableCell>{r.colid || "-"}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
}
