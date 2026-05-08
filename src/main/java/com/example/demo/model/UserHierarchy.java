// User.java
@Entity
@Data
@Inheritance(strategy = InheritanceType.JOINED) // This handles the ISA triangle in your ERD
public abstract class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;
    private String name;
    private String email;
    private String password;
    private String role;
}

// Artisan.java
@Entity
@Data
public class Artisan extends User {
    private String shopName;
    private String biography;
    private String profilePicture;
}

// Customer.java
@Entity
@Data
public class Customer extends User {
    private String address;
    private String phone;
}

// Admin.java
@Entity
@Data
public class Admin extends User {
    // Inherits ID, Name, Email, Password from User
}