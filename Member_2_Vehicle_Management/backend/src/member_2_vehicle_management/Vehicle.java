package member2;

public abstract class Vehicle {
    private String id, brand, model;
    private double pricePerDay;
    public Vehicle(String id, String brand, String model, double pricePerDay) {
        this.id=id; this.brand=brand; this.model=model; this.pricePerDay=pricePerDay;
    }
    public String getId(){ return id; }
    public String getBrand(){ return brand; }
    public String getModel(){ return model; }
    public double getPricePerDay(){ return pricePerDay; }
    public void setPricePerDay(double price){ if(price < 0) throw new IllegalArgumentException("Price cannot be negative"); pricePerDay=price; }
    public abstract String getType();
}
