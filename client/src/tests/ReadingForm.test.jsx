import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReadingFormModal from '../components/ReadingFormModal';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
  api: {
    createReading: vi.fn(),
    updateReading: vi.fn(),
  },
}));

describe('ReadingFormModal - Client Validation & Form Interactions', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields properly when opened', () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Log Blood Glucose Reading')).toBeInTheDocument();
    expect(screen.getByText('Reading Date')).toBeInTheDocument();
    expect(screen.getByText(/Time Slot/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 110')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Reading/i })).toBeInTheDocument();
  });

  it('validates Rule 1: shows "Please enter a glucose value." when value is empty', async () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(api.createReading).not.toHaveBeenCalled();
  });

  it('validates Rule 2: shows "Value must be between 40 and 600 mg/dl." when value is < 40', async () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = screen.getByPlaceholderText('e.g. 110');
    fireEvent.change(input, { target: { value: '35' } });

    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(api.createReading).not.toHaveBeenCalled();
  });

  it('validates Rule 2: shows "Value must be between 40 and 600 mg/dl." when value is > 600', async () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const input = screen.getByPlaceholderText('e.g. 110');
    fireEvent.change(input, { target: { value: '650' } });

    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(api.createReading).not.toHaveBeenCalled();
  });

  it('validates Rule 5: shows "Date cannot be in the future." when date is set beyond today', async () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const dateInput = screen.getByLabelText ? screen.getByDisplayValue(new Date().toLocaleDateString('en-CA')) : document.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: '2099-12-31' } });

    const valueInput = screen.getByPlaceholderText('e.g. 110');
    fireEvent.change(valueInput, { target: { value: '115' } });

    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Date cannot be in the future.')).toBeInTheDocument();
    expect(api.createReading).not.toHaveBeenCalled();
  });

  it('submits valid reading and triggers onSuccess and onClose callbacks', async () => {
    api.createReading.mockResolvedValueOnce({
      message: 'Reading added successfully.',
      reading: { id: 10, value: 120, time_slot: 'Morning (fasting)', date: '2026-10-15' },
    });

    render(
      <ReadingFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        defaultDate="2026-10-15"
      />
    );

    const valueInput = screen.getByPlaceholderText('e.g. 110');
    fireEvent.change(valueInput, { target: { value: '120' } });

    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createReading).toHaveBeenCalledWith({
        date: '2026-10-15',
        time_slot: 'Morning (fasting)',
        value: 120,
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
