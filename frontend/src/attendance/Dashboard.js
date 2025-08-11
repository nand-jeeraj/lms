import React, { useEffect, useState } from "react";
import axios from "axios";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import { BASE_URL } from "../services/api";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

// Spinner animation (same as History.js)
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styled Components (from History.js)
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
    cursor: pointer;
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

const StudentCell = styled(TableCell)`
  font-weight: 600;
  color: #2b6cb0;
`;

const CountCell = styled(TableCell)`
  font-weight: 600;
  color: #38a169;
  text-align: right;
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

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    colid: "",
    program_code: "",
    year: "",
    course_code: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentChartData, setStudentChartData] = useState(null);

  // Fetch attendance data
  const fetchData = () => {
    setLoading(true);
    axios
      .get(`${BASE_URL}api/attendance_dashboard`, { params: filters })
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error fetching data:", err))
      .finally(() => setLoading(false));
  };

  // Fetch specific student attendance
  const fetchStudentData = (studentName) => {
    axios
      .get(`${BASE_URL}api/attendance_dashboard`, {
        params: { ...filters, name: studentName },
      })
      .then((res) => {
        const total = res.data.reduce((sum, item) => sum + item.count, 0);
        const present = total;
        const absent = Math.max(0, 200 - total); // Mock absent value

        setStudentChartData({
          labels: ["Present", "Absent"],
          datasets: [
            {
              label: "Attendance",
              data: [present, absent],
              backgroundColor: ["#38a169", "#e53e3e"],
            },
          ],
        });
      })
      .catch((err) => console.error("Error fetching student data:", err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((d) =>
    d._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <Card initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Title>Attendance Dashboard</Title>

        {/* Filter Section */}
        <FilterSection>
          <Input
            placeholder="College ID"
            value={filters.colid}
            onChange={(e) =>
              setFilters({ ...filters, colid: e.target.value })
            }
          />
          <Input
            placeholder="Program Code"
            value={filters.program_code}
            onChange={(e) =>
              setFilters({ ...filters, program_code: e.target.value })
            }
          />
          {/* <Input
            placeholder="Year"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          />
          <Input
            placeholder="Course Code"
            value={filters.course_code}
            onChange={(e) =>
              setFilters({ ...filters, course_code: e.target.value })
            }
          /> */}
          <Button onClick={fetchData}>Apply Filters</Button>
        </FilterSection>

        {/* Search */}
        <Input
          placeholder="Search by student name"
          style={{ marginBottom: "1rem", width: "100%" }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {loading ? (
          <LoadingSpinner />
        ) : filteredData.length === 0 ? (
          <EmptyState>No attendance data found.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Student</TableHeaderCell>
                <TableHeaderCell style={{ textAlign: "right" }}>
                  Attendance Count
                </TableHeaderCell>
              </tr>
            </TableHeader>
            <tbody>
              {filteredData.map((d, idx) => (
                <TableRow
                  key={idx}
                  onClick={() => {
                    setSelectedStudent(d._id);
                    fetchStudentData(d._id);
                  }}
                >
                  <StudentCell>{d._id}</StudentCell>
                  <CountCell>{d.count}</CountCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}

        {/* Student Pie Chart */}
        {selectedStudent && studentChartData && (
          <div style={{ marginTop: "2rem" }}>
            <h3>
              Attendance Report for <b>{selectedStudent}</b>
            </h3>
            <Pie data={studentChartData} />
          </div>
        )}
      </Card>
    </Container>
  );
}
