package oauth2;

import lombok.SneakyThrows;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@RestController
public class OAuth2Controller {

    private static final String ACCESS_TOKEN = "AccessToken";
    private static final String REFRESH_TOKEN = "RefreshToken";

    private final Map<String, String> store = new ConcurrentHashMap<>();

    @PostMapping("/api/login")
    public ResponseEntity<?> login(@RequestParam("username") String username,
                                   @RequestParam("password") String password) {
        mockLongTimeOperation();
        var accessToken = generateUUID();
        var refreshToken = generateUUID();
        this.store.put(ACCESS_TOKEN, accessToken);
        this.store.put(REFRESH_TOKEN, refreshToken);
        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken
        ));
    }

    @PostMapping("/api/logout")
    public ResponseEntity<?> logout(@RequestParam("accessToken") String accessToken) {
        mockLongTimeOperation();
        this.store.clear();
        return ResponseEntity.ok(Map.of());
    }

    @PostMapping("/api/expireAccessToken")
    public ResponseEntity<?> expireAccessToken(@RequestParam("accessToken") String accessToken) {
        mockLongTimeOperation();
        this.store.remove(ACCESS_TOKEN);
        return ResponseEntity.ok(Map.of());
    }

    @PostMapping("/api/expireRefreshToken")
    public ResponseEntity<?> expireRefreshToken(@RequestParam("accessToken") String accessToken) {
        mockLongTimeOperation();
        this.store.remove(REFRESH_TOKEN);
        return ResponseEntity.ok(Map.of());
    }


    @PostMapping("/api/refreshToken")
    public ResponseEntity<?> refreshToken(@RequestParam("refreshToken") String refreshToken) {
        mockLongTimeOperation();
        if (Objects.equals(this.store.get(REFRESH_TOKEN), refreshToken)) {
            var accessToken = generateUUID();
            this.store.put(ACCESS_TOKEN, accessToken);
            return ResponseEntity.ok(Map.of("accessToken", accessToken));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "RefreshToken已失效，请重新登录"));
        }
    }

    @GetMapping("/api/status")
    public ResponseEntity<?> getStatus(@RequestHeader("AccessToken") String accessToken) {
        mockLongTimeOperation();
        var isLoggedIn = Objects.equals(this.store.get(ACCESS_TOKEN), accessToken);
        return ResponseEntity.ok(Map.of("isLoggedIn", isLoggedIn));
    }

    @GetMapping("/api/mockRequest")
    public ResponseEntity<?> mockRequest(@RequestHeader("AccessToken") String accessToken) {
        mockLongTimeOperation();
        if (Objects.equals(this.store.get(ACCESS_TOKEN), accessToken)) {
            return ResponseEntity.ok(Map.of("data", Instant.now()));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "AccessToken已失效"));
        }
    }

    @SneakyThrows
    private static void mockLongTimeOperation() {
        TimeUnit.SECONDS.sleep(1);
    }

    private static String generateUUID() {
        return UUID.randomUUID().toString().replaceAll("-", "");
    }
}
