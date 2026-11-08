package member3;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * MEMBER 3 - Booking Management: SINGLY LINKED LIST of rented vehicle records.
 *
 *   head -> [record] -> [record] -> [record] -> null
 *
 * A record is added at the tail when a booking becomes "Confirmed" (vehicle rented
 * out) and unlinked when the booking is Completed, Cancelled or deleted (vehicle
 * returned). Nodes are linked by hand - no java.util.LinkedList is used.
 */
public class RentedVehicleLinkedList {

    private static class Node {
        RentedVehicleRecord data;
        Node next;
        Node(RentedVehicleRecord data) { this.data = data; }
    }

    private Node head;
    private Node tail;
    private int size;

    /** Adds a record at the end (O(1) thanks to the tail pointer). */
    public void addLast(RentedVehicleRecord record) {
        if (findByBookingId(record.getBookingId()) != null)
            throw new IllegalArgumentException("Booking " + record.getBookingId() + " is already in the rented list.");
        Node node = new Node(record);
        if (head == null) { head = tail = node; }
        else { tail.next = node; tail = node; }
        size++;
    }

    /** Adds a record at the front (O(1)). */
    public void addFirst(RentedVehicleRecord record) {
        if (findByBookingId(record.getBookingId()) != null)
            throw new IllegalArgumentException("Booking " + record.getBookingId() + " is already in the rented list.");
        Node node = new Node(record);
        node.next = head;
        head = node;
        if (tail == null) tail = node;
        size++;
    }

    /** Unlinks the node with this rental id. Returns true if something was removed. */
    public boolean removeByRentalId(String rentalId) {
        return unlink(true, rentalId);
    }

    /** Unlinks the node for this booking. Returns true if something was removed. */
    public boolean removeByBookingId(String bookingId) {
        return unlink(false, bookingId);
    }

    private boolean unlink(boolean byRental, String key) {
        Node prev = null, cur = head;
        while (cur != null) {
            String id = byRental ? cur.data.getRentalId() : cur.data.getBookingId();
            if (id.equals(key)) {
                if (prev == null) head = cur.next; else prev.next = cur.next;
                if (cur == tail) tail = prev;
                size--;
                return true;
            }
            prev = cur;
            cur = cur.next;
        }
        return false;
    }

    public RentedVehicleRecord findByRentalId(String rentalId) {
        for (Node n = head; n != null; n = n.next) if (n.data.getRentalId().equals(rentalId)) return n.data;
        return null;
    }

    public RentedVehicleRecord findByBookingId(String bookingId) {
        for (Node n = head; n != null; n = n.next) if (n.data.getBookingId().equals(bookingId)) return n.data;
        return null;
    }

    /** The rental record that keeps this vehicle unavailable today or later (earliest return date wins), or null. */
    public RentedVehicleRecord findActiveByVehicle(String vehicleId, LocalDate today) {
        RentedVehicleRecord found = null;
        for (Node n = head; n != null; n = n.next) {
            RentedVehicleRecord r = n.data;
            if (!r.getVehicleId().equals(vehicleId) || !r.isActiveOn(today)) continue;
            if (found == null || r.getReturnDate().compareTo(found.getReturnDate()) < 0) found = r;
        }
        return found;
    }

    /** Replaces the data of the node that has the same booking id. */
    private boolean update(RentedVehicleRecord record) {
        for (Node n = head; n != null; n = n.next) {
            if (n.data.getBookingId().equals(record.getBookingId())) { n.data = record; return true; }
        }
        return false;
    }

    /**
     * Makes the list match the given records: unlinks nodes that are no longer wanted,
     * refreshes nodes that changed, and appends new ones.
     */
    public void sync(List<RentedVehicleRecord> wanted) {
        Set<String> keep = new HashSet<>();
        for (RentedVehicleRecord r : wanted) keep.add(r.getBookingId());

        Node prev = null, cur = head;
        while (cur != null) {                       // remove returned / cancelled rentals
            if (!keep.contains(cur.data.getBookingId())) {
                if (prev == null) head = cur.next; else prev.next = cur.next;
                if (cur == tail) tail = prev;
                size--;
                cur = (prev == null) ? head : prev.next;
            } else {
                prev = cur;
                cur = cur.next;
            }
        }
        for (RentedVehicleRecord r : wanted) {      // refresh existing, append new
            if (!update(r)) addLast(r);
        }
    }

    /** Walks the list from head to tail. */
    public List<RentedVehicleRecord> toList() {
        List<RentedVehicleRecord> out = new ArrayList<>();
        for (Node n = head; n != null; n = n.next) out.add(n.data);
        return out;
    }

    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }
    public void clear() { head = tail = null; size = 0; }
}
