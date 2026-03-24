import { Room } from '../types';
import { Invoice } from '../types/invoice';

/**
 * Filter rooms to only show those WITHOUT an invoice for the specified month/year
 */
export const filterRoomsWithoutInvoice = (
  rooms: Room[],
  invoices: Invoice[],
  month: number,
  year: number
): Room[] => {
  return rooms.filter(room => {
    const hasInvoiceThisMonth = invoices.some(invoice =>
      invoice.roomId === room.id &&
      invoice.month === month &&
      invoice.year === year
    );
    return !hasInvoiceThisMonth;
  });
};
