package member2;

/**
 * One vehicle row from data/vehicles.txt, plus its live availability.
 * Record format: id|name|type|city|price|seats|transmission|fuel|year|rating|reviews|tag|about
 */
public class VehicleListing {
    private final String id, name, type, city;
    private final double pricePerDay;
    private boolean rented;
    private String rentedUntil = "";

    public VehicleListing(String id, String name, String type, String city, double pricePerDay) {
        this.id = id; this.name = name; this.type = type; this.city = city; this.pricePerDay = pricePerDay;
    }

    public static VehicleListing fromRecord(String line) {
        String[] f = line.split("\\|", -1);
        double price;
        try { price = Double.parseDouble(f.length > 4 ? f[4] : "0"); } catch (NumberFormatException e) { price = 0; }
        return new VehicleListing(f[0], f.length > 1 ? f[1] : "", f.length > 2 ? f[2] : "", f.length > 3 ? f[3] : "", price);
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getType() { return type; }
    public String getCity() { return city; }
    public double getPricePerDay() { return pricePerDay; }
    public boolean isAvailable() { return !rented; }
    public String getRentedUntil() { return rentedUntil; }

    public void markRented(String until) { this.rented = true; this.rentedUntil = until == null ? "" : until; }
}
