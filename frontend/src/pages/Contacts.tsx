import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  lastContact: string;
  status: 'active' | 'inactive' | 'blocked';
}

// Mock data for contacts
const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    tags: ['customer', 'premium'],
    lastContact: '2023-05-15',
    status: 'active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '+0987654321',
    email: 'jane@example.com',
    tags: ['lead'],
    lastContact: '2023-05-10',
    status: 'active',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    phone: '+1122334455',
    email: 'bob@example.com',
    tags: ['customer'],
    lastContact: '2023-04-28',
    status: 'inactive',
  },
  {
    id: '4',
    name: 'Alice Brown',
    phone: '+5566778899',
    email: 'alice@example.com',
    tags: ['customer', 'support'],
    lastContact: '2023-05-12',
    status: 'active',
  },
  {
    id: '5',
    name: 'Charlie Wilson',
    phone: '+1231231234',
    email: 'charlie@example.com',
    tags: ['lead', 'potential'],
    lastContact: '2023-05-01',
    status: 'inactive',
  },
];

const Contacts: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // In a real app, you would filter from the API
    // For now, we'll filter the mock data
    if (event.target.value === '') {
      setContacts(mockContacts);
    } else {
      const filtered = mockContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(event.target.value.toLowerCase()) ||
          contact.phone.includes(event.target.value) ||
          contact.email.toLowerCase().includes(event.target.value.toLowerCase())
      );
      setContacts(filtered);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Contacts
        </Typography>
        <Button variant="contained" startIcon={<PersonAddIcon />}>
          Add Contact
        </Button>
      </Box>

      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          label="Search Contacts"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mr: 2 }}
        />
        <Button variant="outlined" startIcon={<FilterListIcon />}>
          Filter
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="contacts table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Last Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((contact) => (
                <TableRow key={contact.id} hover>
                  <TableCell component="th" scope="row">
                    {contact.name}
                  </TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>
                    {contact.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>{contact.lastContact}</TableCell>
                  <TableCell>
                    <Chip
                      label={contact.status}
                      color={getStatusColor(contact.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" aria-label="edit">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label="delete">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={contacts.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default Contacts; 