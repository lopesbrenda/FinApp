/**
 * Session Management with JWT + HttpOnly Cookies
 * Handles access/refresh tokens securely
 */
class SessionManager {
    constructor() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
    }

    // Store tokens in HttpOnly cookies (server-side set)
    setTokens(accessToken, refreshToken) {
        // Tokens are set via HTTP response cookies by server
        // This method just updates local state for API calls
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.setTokenExpiry(accessToken);
    }

    setTokenExpiry(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.tokenExpiry = new Date(payload.exp * 1000);
        } catch (e) {
            console.warn("Could not parse token expiry:", e);
        }
    }

    // Check if access token is expired
    isTokenExpired() {
        return !this.accessToken || (this.tokenExpiry && new Date() > this.tokenExpiry);
    }

    // Auto-refresh token before API calls
    async ensureValidToken() {
        if (!this.isTokenExpired()) return true;

        try {
            const response = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Include HttpOnly cookies
                body: JSON.stringify({ refresh_token: this.refreshToken })
            });

            if (response.ok) {
                const { access_token, refresh_token } = await response.json();
                this.setTokens(access_token, refresh_token);
                return true;
            }
        } catch (error) {
            console.error("Token refresh failed:", error);
            this.logout();
        }
        return false;
    }

    // Add auth header to requests
    async fetchWithAuth(url, options = {}) {
        if (!(await this.ensureValidToken())) {
            window.location.href = "/login";
            return;
        }

        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                "Authorization": `Bearer ${this.accessToken}`
            },
            credentials: "include"
        });
    }

    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login";
    }
}

// Global session manager instance
window.sessionManager = new SessionManager();
