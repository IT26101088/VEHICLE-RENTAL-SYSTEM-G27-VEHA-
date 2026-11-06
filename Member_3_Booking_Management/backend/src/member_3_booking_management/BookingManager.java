package member3;

import java.io.*;
import java.nio.file.*;
import java.util.*;

/** Basic text-file CRUD starter. Format: id|customerId|vehicleId|pickupDate|returnDate|status */
public class BookingManager {
    private final Path file = Paths.get("bookings.txt");
    public List<String> readAll() throws IOException {
        if (!Files.exists(file)) return new ArrayList<>();
        return Files.readAllLines(file);
    }
    public void add(String record) throws IOException {
        Files.write(file, List.of(record), StandardOpenOption.CREATE, StandardOpenOption.APPEND);
    }
    public void deleteById(String id) throws IOException {
        List<String> kept = new ArrayList<>();
        for (String line : readAll()) {
            String[] fields = line.split("\\|", -1);
            if (fields.length > 0 && !fields[0].equals(id)) kept.add(line);
        }
        Files.write(file, kept, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
    }
}
