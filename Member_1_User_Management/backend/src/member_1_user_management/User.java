package member1;

/** Base user model. Encapsulates common user details. */
public class User {
    private String id;
    private String name;
    private String email;
    private String password;

    public User(String id, String name, String email, String password) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
    }
    public String getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    // For a real system, never store plaintext passwords.
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
