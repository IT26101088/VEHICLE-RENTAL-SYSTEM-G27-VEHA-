package veha;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.*;
import member2.VehicleListing;
import member2.VehicleSelectionSort;
import member3.RentedVehicleLinkedList;
import member3.RentedVehicleRecord;

/** Lightweight Java 17 HTTP backend. Uses pipe-separated text files in ../data. */
public class VehaServer {
    private static final Path ROOT = Paths.get(".").toAbsolutePath().normalize();
    private static final Path DATA = ROOT.resolve("data");
    private static final Map<String,String> FILES = Map.of(
        "users", "users.txt", "vehicles", "vehicles.txt",
        "bookings", "bookings.txt", "payments", "payments.txt", "rented", "rented.txt");
    /** Member 3: linked list of currently rented / reserved vehicles (persisted in data/rented.txt). */
    private static final RentedVehicleLinkedList RENTED = new RentedVehicleLinkedList();

    public static void main(String[] args) throws Exception {
        Files.createDirectories(DATA);
        for (String f : FILES.values()) if (!Files.exists(DATA.resolve(f))) Files.createFile(DATA.resolve(f));
        loadRented();
        syncRentedFromBookings();
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/", VehaServer::api);
        server.createContext("/", VehaServer::staticFiles);
        server.setExecutor(null);
        server.start();
        System.out.println("VEHA running at http://localhost:" + port + "/");
    }

    private static void api(HttpExchange x) throws IOException {
        cors(x);
        if ("OPTIONS".equalsIgnoreCase(x.getRequestMethod())) { x.sendResponseHeaders(204,-1); return; }
        String path=x.getRequestURI().getPath().substring("/api/".length());
        String[] bits=path.split("/"); String resource=bits[0];
        try {
            if ("report".equals(resource) && "GET".equals(x.getRequestMethod())) { report(x); return; }
            if (!FILES.containsKey(resource)) { send(x,404,"{\"error\":\"Unknown resource\"}"); return; }
            if ("rented".equals(resource)) { rented(x, bits); return; }
            if ("vehicles".equals(resource) && bits.length>1 && "sorted".equals(bits[1]) && "GET".equals(x.getRequestMethod())) { sortedVehicles(x); return; }
            Path file=DATA.resolve(FILES.get(resource));
            List<String> rows=Files.readAllLines(file,StandardCharsets.UTF_8);
            String method=x.getRequestMethod();
            if ("GET".equals(method)) { send(x,200,toJson(rows)); return; }
            Map<String,String> form=parseForm(new String(x.getRequestBody().readAllBytes(),StandardCharsets.UTF_8));
            if ("POST".equals(method)) {
                String record=form.getOrDefault("record", "");
                if (record.isBlank()) { send(x,400,"{\"error\":\"record is required\"}"); return; }
                if (record.contains("\n") || record.contains("\r")) { send(x,400,"{\"error\":\"Invalid record\"}"); return; }
                rows.add(record); Files.write(file,rows,StandardCharsets.UTF_8); if("bookings".equals(resource)) syncRentedFromBookings(); send(x,201,"{\"ok\":true}"); return;
            }
            if ("PUT".equals(method) && bits.length<2) {
                /* Bulk replace: records=<newline separated pipe-separated rows> */
                String all=form.getOrDefault("records", "");
                List<String> fresh=new ArrayList<>();
                for(String line:all.split("\\r?\\n")) if(!line.isBlank()) fresh.add(line);
                Files.write(file,fresh,StandardCharsets.UTF_8); if("bookings".equals(resource)) syncRentedFromBookings(); send(x,200,"{\"ok\":true}"); return;
            }
            if (bits.length<2) { send(x,400,"{\"error\":\"Record id is required\"}"); return; }
            String id=URLDecoder.decode(bits[1],StandardCharsets.UTF_8); boolean found=false;
            if ("DELETE".equals(method)) {
                int before=rows.size(); rows.removeIf(r -> field(r,0).equals(id)); found=rows.size()!=before;
            } else if ("PUT".equals(method)) {
                String record=form.getOrDefault("record", "");
                if (record.isBlank() || !field(record,0).equals(id)) { send(x,400,"{\"error\":\"record must include matching id\"}"); return; }
                for(int i=0;i<rows.size();i++) if(field(rows.get(i),0).equals(id)){rows.set(i,record);found=true;break;}
            } else { send(x,405,"{\"error\":\"Method not allowed\"}"); return; }
            if(found) { Files.write(file,rows,StandardCharsets.UTF_8); if("bookings".equals(resource)) syncRentedFromBookings(); }
            send(x,found?200:404,found?"{\"ok\":true}":"{\"error\":\"Record not found\"}");
        } catch (IllegalArgumentException e) { send(x,400,"{\"error\":"+quote(e.getMessage())+"}"); }
          catch (Exception e) { send(x,500,"{\"error\":"+quote(e.getMessage()==null?"Server error":e.getMessage())+"}"); }
    }


    // ---------- Member 3: rented vehicle records (singly linked list) ----------

    private static void loadRented() throws IOException {
        RENTED.clear();
        for (String line : Files.readAllLines(DATA.resolve("rented.txt"), StandardCharsets.UTF_8)) {
            if (line.isBlank()) continue;
            try { RENTED.addLast(RentedVehicleRecord.fromRecord(line)); } catch (IllegalArgumentException ignored) { }
        }
    }

    private static void saveRented() throws IOException {
        List<String> lines = new ArrayList<>();
        for (RentedVehicleRecord r : RENTED.toList()) lines.add(r.toRecord());
        Files.write(DATA.resolve("rented.txt"), lines, StandardCharsets.UTF_8);
    }

    /** A booking with status "Confirmed" means the vehicle is rented out; any other status returns it. */
    private static void syncRentedFromBookings() throws IOException {
        Map<String,String> names = new HashMap<>();
        for (String v : Files.readAllLines(DATA.resolve("vehicles.txt"), StandardCharsets.UTF_8)) if (!v.isBlank()) names.put(field(v,0), field(v,1));
        List<RentedVehicleRecord> wanted = new ArrayList<>();
        for (String b : Files.readAllLines(DATA.resolve("bookings.txt"), StandardCharsets.UTF_8)) {
            if (b.isBlank() || !field(b,10).equalsIgnoreCase("Confirmed")) continue;
            String vid = field(b,3);
            wanted.add(new RentedVehicleRecord("RNT-" + field(b,0), field(b,0), vid, names.getOrDefault(vid, vid),
                field(b,2), field(b,5), field(b,6), "Rented"));
        }
        RENTED.sync(wanted);
        saveRented();
    }

    private static boolean setBookingStatus(String bookingId, String status) throws IOException {
        Path file = DATA.resolve("bookings.txt");
        List<String> rows = Files.readAllLines(file, StandardCharsets.UTF_8);
        boolean changed = false;
        for (int i = 0; i < rows.size(); i++) {
            if (!field(rows.get(i),0).equals(bookingId)) continue;
            String[] f = rows.get(i).split("\\|", -1);
            if (f.length > 10) { f[10] = status; rows.set(i, String.join("|", f)); changed = true; }
        }
        if (changed) Files.write(file, rows, StandardCharsets.UTF_8);
        return changed;
    }

    /**
     * GET    /api/rented[?vehicleId=v1]  - list the linked list head-to-tail (or search by vehicle)
     * POST   /api/rented  bookingId=...  - rent out: confirms the booking and appends a node
     * DELETE /api/rented/{rentalId}      - return the vehicle: unlinks the node, booking becomes Completed
     */
    private static void rented(HttpExchange x, String[] bits) throws IOException {
        String method = x.getRequestMethod();
        if ("GET".equals(method)) {
            String q = x.getRequestURI().getRawQuery();
            Map<String,String> params = parseForm(q == null ? "" : q);
            List<String> out = new ArrayList<>();
            if (params.containsKey("vehicleId")) {
                RentedVehicleRecord r = RENTED.findActiveByVehicle(params.get("vehicleId"), LocalDate.now());
                if (r != null) out.add(r.toRecord());
            } else {
                for (RentedVehicleRecord r : RENTED.toList()) out.add(r.toRecord());
            }
            send(x, 200, toJson(out));
            return;
        }
        Map<String,String> form = parseForm(new String(x.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
        if ("POST".equals(method)) {
            String bookingId = form.getOrDefault("bookingId", "").trim();
            if (bookingId.isEmpty()) { send(x,400,"{\"error\":\"bookingId is required\"}"); return; }
            if (!setBookingStatus(bookingId, "Confirmed")) { send(x,404,"{\"error\":\"Booking not found\"}"); return; }
            syncRentedFromBookings();
            send(x, 201, "{\"ok\":true,\"size\":" + RENTED.size() + "}");
            return;
        }
        if ("DELETE".equals(method)) {
            if (bits.length < 2) { send(x,400,"{\"error\":\"Rental id is required\"}"); return; }
            String rentalId = URLDecoder.decode(bits[1], StandardCharsets.UTF_8);
            RentedVehicleRecord r = RENTED.findByRentalId(rentalId);
            if (r == null) { send(x,404,"{\"error\":\"Rental record not found\"}"); return; }
            setBookingStatus(r.getBookingId(), "Completed");
            syncRentedFromBookings();
            send(x, 200, "{\"ok\":true,\"size\":" + RENTED.size() + "}");
            return;
        }
        send(x,405,"{\"error\":\"Method not allowed\"}");
    }

    // ---------- Member 2: selection sort of vehicles ----------

    /** GET /api/vehicles/sorted?by=price|availability&order=asc|desc */
    private static void sortedVehicles(HttpExchange x) throws IOException {
        String q = x.getRequestURI().getRawQuery();
        Map<String,String> params = parseForm(q == null ? "" : q);
        String by = params.getOrDefault("by", "price");
        String order = params.getOrDefault("order", "asc");
        if (!(by.equals("price") || by.equals("availability")) || !(order.equals("asc") || order.equals("desc"))) {
            send(x,400,"{\"error\":\"by must be price|availability and order asc|desc\"}");
            return;
        }
        boolean asc = order.equals("asc");
        LocalDate today = LocalDate.now();

        List<VehicleListing> list = new ArrayList<>();
        for (String line : Files.readAllLines(DATA.resolve("vehicles.txt"), StandardCharsets.UTF_8)) {
            if (line.isBlank()) continue;
            VehicleListing v = VehicleListing.fromRecord(line);
            RentedVehicleRecord r = RENTED.findActiveByVehicle(v.getId(), today);   // availability comes from the linked list
            if (r != null) v.markRented(r.getReturnDate());
            list.add(v);
        }
        VehicleListing[] items = list.toArray(new VehicleListing[0]);
        VehicleSelectionSort sorter = new VehicleSelectionSort();
        sorter.sort(items, by.equals("price") ? VehicleSelectionSort.byRentPrice(asc) : VehicleSelectionSort.byAvailability(asc));

        StringJoiner j = new StringJoiner(",", "[", "]");
        for (VehicleListing v : items) {
            j.add("{\"id\":" + quote(v.getId()) + ",\"price\":" + (long) v.getPricePerDay()
                + ",\"available\":" + v.isAvailable() + ",\"rentedUntil\":" + quote(v.getRentedUntil()) + "}");
        }
        send(x, 200, "{\"algorithm\":\"Selection sort\",\"by\":" + quote(by) + ",\"order\":" + quote(order)
            + ",\"count\":" + items.length + ",\"comparisons\":" + sorter.getComparisons()
            + ",\"swaps\":" + sorter.getSwaps() + ",\"vehicles\":" + j + "}");
    }

    private static void report(HttpExchange x) throws IOException {
        Map<String,Object> r=new LinkedHashMap<>();
        for(String key:FILES.keySet()) r.put(key,Files.readAllLines(DATA.resolve(FILES.get(key))).size());
        long revenue=0; for(String line:Files.readAllLines(DATA.resolve("payments.txt"))) try { revenue+=Long.parseLong(field(line,2).split("\\.")[0]); } catch(Exception ignored){}
        r.put("recordedPaymentTotal",revenue); send(x,200,"{\"users\":"+r.get("users")+",\"vehicles\":"+r.get("vehicles")+",\"bookings\":"+r.get("bookings")+",\"payments\":"+r.get("payments")+",\"rented\":"+r.get("rented")+",\"recordedPaymentTotal\":"+revenue+"}");
    }
    private static String field(String s,int n){String[] a=s.split("\\|",-1);return a.length>n?a[n]:"";}
    private static Map<String,String> parseForm(String body){Map<String,String> m=new HashMap<>();for(String p:body.split("&")){int i=p.indexOf('=');if(i>=0)m.put(URLDecoder.decode(p.substring(0,i),StandardCharsets.UTF_8),URLDecoder.decode(p.substring(i+1),StandardCharsets.UTF_8));}return m;}
    private static String toJson(List<String> rows){StringJoiner j=new StringJoiner(",","[","]");for(String s:rows)j.add(quote(s));return j.toString();}
    private static String quote(String s){if(s==null)return "null";return "\""+s.replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n").replace("\r","\\r")+"\"";}
    private static void cors(HttpExchange x){x.getResponseHeaders().set("Access-Control-Allow-Origin","*");x.getResponseHeaders().set("Access-Control-Allow-Methods","GET,POST,PUT,DELETE,OPTIONS");x.getResponseHeaders().set("Access-Control-Allow-Headers","Content-Type");}
    private static void send(HttpExchange x,int status,String body)throws IOException{byte[] b=body.getBytes(StandardCharsets.UTF_8);x.getResponseHeaders().set("Content-Type","application/json; charset=utf-8");x.sendResponseHeaders(status,b.length);try(OutputStream o=x.getResponseBody()){o.write(b);}}
    private static void staticFiles(HttpExchange x)throws IOException{
        String p=x.getRequestURI().getPath(); if(p.equals("/"))p="/index.html";
        Path base=ROOT.resolve("Shared_Project").normalize(); Path target=base.resolve(p.substring(1)).normalize();
        if(!target.startsWith(base)||!Files.isRegularFile(target)){byte[] n="Not found".getBytes();x.sendResponseHeaders(404,n.length);x.getResponseBody().write(n);x.close();return;}
        String tp=target.toString().toLowerCase(); String type=tp.endsWith(".html")?"text/html":tp.endsWith(".css")?"text/css":tp.endsWith(".js")?"application/javascript":tp.endsWith(".svg")?"image/svg+xml":tp.endsWith(".png")?"image/png":(tp.endsWith(".jpg")||tp.endsWith(".jpeg"))?"image/jpeg":"application/octet-stream";
        byte[] data=Files.readAllBytes(target);x.getResponseHeaders().set("Content-Type",type+"; charset=utf-8");x.sendResponseHeaders(200,data.length);try(OutputStream o=x.getResponseBody()){o.write(data);}
    }
}
