package member1;

import java.io.*;
import java.nio.file.*;
import java.util.*;

/** Basic text-file CRUD starter. Format: id|name|email|password */
public class UserManager {
    private final Path file = Paths.get("users.txt");

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
            if (line.split("\\|", -1).length > 0 && !line.split("\\|", -1)[0].equals(id)) kept.add(line);
        }
        Files.write(file, kept, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
    }
}
