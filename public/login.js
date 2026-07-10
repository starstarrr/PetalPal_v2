function getLoginElement(id) {
  return document.getElementById(id);
}

function setAuthMessage(elementId, message, isError = false) {
  const element = getLoginElement(elementId);

  if (!element) {
    return;
  }

  element.textContent = message;
  element.style.color = isError ? "#c0392b" : "#2e7d32";
}

function clearAuthMessages() {
  setAuthMessage("loginMessage", "");
  setAuthMessage("registerMessage", "");

  const accountResult = getLoginElement("accountResult");

  if (accountResult) {
    accountResult.style.display = "none";
  }
}

function showLoginForm() {
  const loginForm = getLoginElement("loginForm");
  const registerForm = getLoginElement("registerForm");
  const showLoginBtn = getLoginElement("showLoginBtn");
  const showRegisterBtn = getLoginElement("showRegisterBtn");

  if (loginForm) {
    loginForm.style.display = "block";
  }

  if (registerForm) {
    registerForm.style.display = "none";
  }

  if (showLoginBtn) {
    showLoginBtn.classList.add("active");
  }

  if (showRegisterBtn) {
    showRegisterBtn.classList.remove("active");
  }

  clearAuthMessages();
}

function showRegisterForm() {
  const loginForm = getLoginElement("loginForm");
  const registerForm = getLoginElement("registerForm");
  const showLoginBtn = getLoginElement("showLoginBtn");
  const showRegisterBtn = getLoginElement("showRegisterBtn");

  if (loginForm) {
    loginForm.style.display = "none";
  }

  if (registerForm) {
    registerForm.style.display = "block";
  }

  if (showLoginBtn) {
    showLoginBtn.classList.remove("active");
  }

  if (showRegisterBtn) {
    showRegisterBtn.classList.add("active");
  }

  clearAuthMessages();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();

  return {
    error: text || `Request failed with status ${res.status}`
  };
}

async function registerAccount(name, email, password, avatar) {
  const res = await fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      email,
      password,
      avatar
    })
  });

  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || "Registration failed");
  }

  return data;
}

async function loginAccount(email, password) {
  const res = await fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data;
}

async function finishLogin(user) {
  if (!user || !user.id) {
    throw new Error("The server did not return a valid user");
  }

  setCurrentUserId(user.id);
  currentUserProfile = user;

  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}?userId=${encodeURIComponent(user.id)}`
  );

  showAppMode();
  updateCurrentProfileText();

  await renderAddFriendOptions();
  await renderFriendsList();
  await loadMyGarden();

  startPolling();
}

function clearLoginInputs() {
  const loginEmail = getLoginElement("loginEmail");
  const loginPassword = getLoginElement("loginPassword");

  if (loginEmail) {
    loginEmail.value = "";
  }

  if (loginPassword) {
    loginPassword.value = "";
  }
}

function clearRegisterInputs() {
  const registerName = getLoginElement("registerName");
  const registerEmail = getLoginElement("registerEmail");
  const registerPassword = getLoginElement("registerPassword");
  const registerConfirmPassword = getLoginElement(
    "registerConfirmPassword"
  );
  const registerAvatar = getLoginElement("registerAvatar");

  if (registerName) {
    registerName.value = "";
  }

  if (registerEmail) {
    registerEmail.value = "";
  }

  if (registerPassword) {
    registerPassword.value = "";
  }

  if (registerConfirmPassword) {
    registerConfirmPassword.value = "";
  }

  if (registerAvatar) {
    registerAvatar.value = "🦋";
  }
}

function setupAuthTabs() {
  const showLoginBtn = getLoginElement("showLoginBtn");
  const showRegisterBtn = getLoginElement("showRegisterBtn");

  if (showLoginBtn) {
    showLoginBtn.addEventListener("click", showLoginForm);
  }

  if (showRegisterBtn) {
    showRegisterBtn.addEventListener("click", showRegisterForm);
  }
}

function setupRegisterButton() {
  const registerBtn = getLoginElement("registerBtn");

  if (!registerBtn) {
    return;
  }

  registerBtn.addEventListener("click", async () => {
    const nameInput = getLoginElement("registerName");
    const emailInput = getLoginElement("registerEmail");
    const passwordInput = getLoginElement("registerPassword");
    const confirmPasswordInput = getLoginElement(
      "registerConfirmPassword"
    );
    const avatarSelect = getLoginElement("registerAvatar");

    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput
      ? emailInput.value.trim().toLowerCase()
      : "";
    const password = passwordInput ? passwordInput.value : "";
    const confirmPassword = confirmPasswordInput
      ? confirmPasswordInput.value
      : "";
    const avatar = avatarSelect ? avatarSelect.value : "🦋";

    clearAuthMessages();

    if (!name) {
      setAuthMessage(
        "registerMessage",
        "Please enter your display name.",
        true
      );
      return;
    }

    if (!email) {
      setAuthMessage(
        "registerMessage",
        "Please enter your email.",
        true
      );
      return;
    }

    if (!isValidEmail(email)) {
      setAuthMessage(
        "registerMessage",
        "Please enter a valid email address.",
        true
      );
      return;
    }

    if (password.length < 6) {
      setAuthMessage(
        "registerMessage",
        "Password must contain at least 6 characters.",
        true
      );
      return;
    }

    if (password !== confirmPassword) {
      setAuthMessage(
        "registerMessage",
        "The passwords do not match.",
        true
      );
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = "Creating Account...";

    try {
      const data = await registerAccount(
        name,
        email,
        password,
        avatar
      );

      const user = data.user || data;

      const accountResult = getLoginElement("accountResult");
      const generatedAccountId = getLoginElement(
        "generatedAccountId"
      );

      if (generatedAccountId) {
        generatedAccountId.textContent = user.id || "";
      }

      if (accountResult) {
        accountResult.style.display = "block";
      }

      setAuthMessage(
        "registerMessage",
        "Registration successful!"
      );

      clearRegisterInputs();

      /*
       * This automatically logs the user in after registration.
       * Delete the next line if you want users to log in manually.
       */
      await finishLogin(user);
    } catch (err) {
      console.error("Registration error:", err);

      setAuthMessage(
        "registerMessage",
        err.message || "Registration failed.",
        true
      );
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "Sign Up";
    }
  });
}

function setupLoginButton() {
  const loginBtn = getLoginElement("loginBtn");

  if (!loginBtn) {
    return;
  }

  loginBtn.addEventListener("click", async () => {
    const emailInput = getLoginElement("loginEmail");
    const passwordInput = getLoginElement("loginPassword");

    const email = emailInput
      ? emailInput.value.trim().toLowerCase()
      : "";
    const password = passwordInput ? passwordInput.value : "";

    clearAuthMessages();

    if (!email) {
      setAuthMessage(
        "loginMessage",
        "Please enter your email.",
        true
      );
      return;
    }

    if (!isValidEmail(email)) {
      setAuthMessage(
        "loginMessage",
        "Please enter a valid email address.",
        true
      );
      return;
    }

    if (!password) {
      setAuthMessage(
        "loginMessage",
        "Please enter your password.",
        true
      );
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging In...";

    try {
      const data = await loginAccount(email, password);
      const user = data.user || data;

      setAuthMessage("loginMessage", "Login successful!");

      clearLoginInputs();
      await finishLogin(user);
    } catch (err) {
      console.error("Login error:", err);

      setAuthMessage(
        "loginMessage",
        err.message || "Login failed.",
        true
      );
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Log In";
    }
  });
}

function setupLogoutButton() {
  const logoutBtn = getLoginElement("logoutBtn");

  if (!logoutBtn) {
    return;
  }

  logoutBtn.addEventListener("click", async () => {
    try {
      if (
        typeof viewMode !== "undefined" &&
        viewMode === "friend" &&
        typeof currentVisitedFriendId !== "undefined" &&
        currentVisitedFriendId
      ) {
        try {
          await leaveVisit(
            currentVisitedFriendId,
            getCurrentUserId()
          );
        } catch (err) {
          console.error("Leave visit during logout error:", err);
        }
      }

      stopPolling();

      clearCurrentUserId();
      currentUserProfile = null;

      if (typeof avatarEl !== "undefined" && avatarEl) {
        avatarEl.remove();
        avatarEl = null;
      }

      if (typeof currentGardenView !== "undefined") {
        currentGardenView = [];
      }

      if (typeof currentViewedGardenData !== "undefined") {
        currentViewedGardenData = null;
      }

      if (typeof myGardenData !== "undefined") {
        myGardenData = null;
      }

      if (typeof currentVisitedFriendId !== "undefined") {
        currentVisitedFriendId = null;
      }

      if (typeof viewMode !== "undefined") {
        viewMode = "mine";
      }

      document.body.classList.remove("friend-mode");

      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );

      updateCurrentProfileText();
      showAuthMode();
      showLoginForm();
    } catch (err) {
      console.error("Logout error:", err);
      alert("Failed to log out");
    }
  });
}

function setupEnterKeyLogin() {
  const loginEmail = getLoginElement("loginEmail");
  const loginPassword = getLoginElement("loginPassword");
  const registerInputs = [
    getLoginElement("registerName"),
    getLoginElement("registerEmail"),
    getLoginElement("registerPassword"),
    getLoginElement("registerConfirmPassword")
  ];

  [loginEmail, loginPassword].forEach((input) => {
    if (!input) {
      return;
    }

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const loginBtn = getLoginElement("loginBtn");

        if (loginBtn) {
          loginBtn.click();
        }
      }
    });
  });

  registerInputs.forEach((input) => {
    if (!input) {
      return;
    }

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const registerBtn = getLoginElement("registerBtn");

        if (registerBtn) {
          registerBtn.click();
        }
      }
    });
  });
}

function setupLogin() {
  setupAuthTabs();
  setupLoginButton();
  setupRegisterButton();
  setupLogoutButton();
  setupEnterKeyLogin();

  showLoginForm();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    isValidEmail,
    showLoginForm,
    showRegisterForm,
    registerAccount,
    loginAccount,
    setupLogin
  };
}