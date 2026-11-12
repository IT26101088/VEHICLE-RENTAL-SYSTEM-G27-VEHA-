package member5;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

/** Reads the shared text data files and generates a simple summary report.
 *  Also provides admin CRUD operations (Create, Update, Delete) on vehicles.txt.
 *  Vehicle line format: id|name|type|location|pricePerDay|seats|gearbox|fuel|year|rating|trips|badge|description */
public class AdminOperations {

    // Same relative-path style as generateReport(). Change this one line if you run from another folder.
    private static final String VEHICLES_FILE = "../Member_2_Vehicle_Management/data/vehicles.txt";

    // ---------- READ (existing) ----------
    public List<String> readFile(String filename) throws IOException {
        Path path = Paths.get(filename);
        return Files.exists(path) ? Files.readAllLines(path) : new ArrayList<>();
    }
    public String generateReport() throws IOException {
        return "Rental System Report\n"
            + "Users: " + readFile("../Member_1_User_Management/data/users.txt").size() + "\n"
            + "Vehicles: " + readFile("../Member_2_Vehicle_Management/data/vehicles.txt").size() + "\n"
            + "Bookings: " + readFile("../Member_3_Booking_Management/data/bookings.txt").size() + "\n"
            + "Payments: " + readFile("../Member_4_Payment_Rental_Cost/data/payments.txt").size();
    }

    // ---------- CREATE ----------
    /** Adds a new vehicle record. Returns false if the record is blank or its id already exists. */
    public boolean createVehicle(String record) throws IOException {
        if (record == null || record.isBlank()) return false;
        String id = idOf(record);
        if (id.isEmpty() || findVehicleIndex(readFile(VEHICLES_FILE), id) >= 0) return false;
        Path path = Paths.get(VEHICLES_FILE);
        if (path.getParent() != null) Files.createDirectories(path.getParent());
        Files.write(path, List.of(record), StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        return true;
    }

    // ---------- UPDATE ----------
    /** Replaces the whole record of the vehicle with this id. Returns false if the id is not found. */
    public boolean updateVehicle(String id, String newRecord) throws IOException {
        if (newRecord == null || newRecord.isBlank()) return false;
        List<String> lines = new ArrayList<>(readFile(VEHICLES_FILE));
        int index = findVehicleIndex(lines, id);
        if (index < 0) return false;
        lines.set(index, newRecord);
        Files.write(Paths.get(VEHICLES_FILE), lines, StandardOpenOption.TRUNCATE_EXISTING);
        return true;
    }

    // ---------- DELETE ----------
    /** Removes the vehicle with this id. Returns false if the id is not found. */
    public boolean deleteVehicle(String id) throws IOException {
        List<String> lines = new ArrayList<>(readFile(VEHICLES_FILE));
        int index = findVehicleIndex(lines, id);
        if (index < 0) return false;
        lines.remove(index);
        Files.write(Paths.get(VEHICLES_FILE), lines, StandardOpenOption.TRUNCATE_EXISTING);
        return true;
    }

    // ---------- helpers ----------
    private String idOf(String line) {
        return line.split("\\|", -1)[0].trim();
    }
    private int findVehicleIndex(List<String> lines, String id) {
        if (id == null) return -1;
        for (int i = 0; i < lines.size(); i++) {
            if (!lines.get(i).isBlank() && idOf(lines.get(i)).equals(id.trim())) return i;
        }
        return -1;
    }
}
