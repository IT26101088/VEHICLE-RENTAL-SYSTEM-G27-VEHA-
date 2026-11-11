package member5;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

/** Reads the shared text data files and generates a simple summary report. */
public class AdminOperations {
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
}
