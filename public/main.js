let currentGardenView = [];
let currentViewedGardenData = null;
let myGardenData = null;

let currentVisitedFriendId = null;
let viewMode = "mine";

let pollTimer = null;
const POLL_INTERVAL = 1200;
let isAddFriendSelectOpen = false;

// 当前选中的 flower id
let selectedFlowerId = null;

function updateGardenTitle(title) {
  const gardenTitle = document.getElementById("gardenTitle");
  if (gardenTitle) {
    gardenTitle.textContent = title;
  }
}

function updateCurrentProfileText() {
  const profileText = document.getElementById("currentProfileText");
  if (!profileText) {
    return;
  }

  if (!currentUserProfile) {
    profileText.textContent = "Not selected";
    return;
  }

  profileText.textContent = `${currentUserProfile.avatar} ${currentUserProfile.name} (${currentUserProfile.id})`;
}

function getMyGarden() {
  return myGardenData ? myGardenData.flowers : [];
}

function getCurrentViewedUserId() {
  return viewMode === "friend" ? currentVisitedFriendId : getCurrentUserId();
}

function applyViewedGardenData(gardenData) {
  currentViewedGardenData = gardenData;
  currentGardenView = gardenData ? gardenData.flowers || [] : [];

  if (!currentGardenView.length) {
    selectedFlowerId = null;
    return;
  }

  if (
    selectedFlowerId !== null &&
    currentGardenView.some((flower) => flower.id === selectedFlowerId)
  ) {
    return;
  }

  selectedFlowerId = null;
}

function applyMyGardenData(gardenData) {
  myGardenData = gardenData;
}

function updateFriendInfo() {
  const friendInfo = document.getElementById("friendInfo");
  const friendMood = document.getElementById("friendMood");
  const friendTodayFlower = document.getElementById("friendTodayFlower");

  if (viewMode !== "friend") {
    if (friendInfo) {
      friendInfo.style.display = "none";
    }
    return;
  }

  if (friendInfo) {
    friendInfo.style.display = "block";
  }

  if (!currentGardenView || currentGardenView.length === 0) {
    if (friendMood) {
      friendMood.textContent = "Mood: Unknown";
    }
    if (friendTodayFlower) {
      friendTodayFlower.textContent = "Today's flower: None";
    }
    return;
  }

  const latest = currentGardenView[currentGardenView.length - 1];

  if (friendMood) {
    friendMood.textContent = `Mood: ${latest.mood}`;
  }

  if (friendTodayFlower) {
    friendTodayFlower.textContent = `Today's flower: ${latest.name}`;
  }
}

function renderVisitRecords() {
  const recordsDiv = document.getElementById("visitRecords");
  if (!recordsDiv) {
    return;
  }

  const records = myGardenData ? myGardenData.visitRecords || [] : [];
  recordsDiv.innerHTML = "";

  if (!records.length) {
    recordsDiv.innerHTML = `<p class="empty-message">No visitors yet 🌱</p>`;
    return;
  }

  records.forEach((record) => {
    const item = document.createElement("div");
    item.className = "visit-record-item";

    item.innerHTML = `
      <p><strong>${record.visitorAvatar} ${record.visitorName}</strong> ${record.action}</p>
      <p>${new Date(record.createdAt).toLocaleString()}</p>
    `;

    recordsDiv.appendChild(item);
  });
}

function renderHostVisitors(activeVisitors) {
  const gardenDiv = document.getElementById("garden");
  if (!gardenDiv) {
    return;
  }

  gardenDiv.querySelectorAll(".host-visitor").forEach((node) => node.remove());

  if (viewMode !== "mine" || !Array.isArray(activeVisitors)) {
    return;
  }

  activeVisitors.forEach((visitor) => {
    const el = document.createElement("div");
    el.className = "host-visitor";
    el.textContent = visitor.avatar || "🦋";
    el.style.left = `${typeof visitor.x === "number" ? visitor.x : 0}px`;
    el.style.top = `${typeof visitor.y === "number" ? visitor.y : 0}px`;
    el.title = visitor.name || "Visitor";

    gardenDiv.appendChild(el);
  });
}

async function refreshMineOnly() {
  const gardenData = await fetchGarden(getCurrentUserId());

  applyMyGardenData(gardenData);
  applyViewedGardenData(gardenData);

  const me = getCurrentUser();
  updateGardenTitle(me ? `${me.name}'s Garden` : "Your Garden");

  updateFriendInfo();
  renderDecorations()
  renderGarden();
  renderVisitRecords();
  renderHostVisitors(gardenData.activeVisitors || []);
  renderTodayFlower();
}

async function refreshCurrentView() {
  const viewedUserId = getCurrentViewedUserId();

  if (!viewedUserId) {
    return;
  }

  const requests = [fetchGarden(viewedUserId)];

  if (viewedUserId !== getCurrentUserId()) {
    requests.push(fetchGarden(getCurrentUserId()));
  }

  const [viewedGarden, ownGarden] = await Promise.all(requests);

  applyViewedGardenData(viewedGarden);

  if (ownGarden) {
    applyMyGardenData(ownGarden);
  } else {
    applyMyGardenData(viewedGarden);
  }

  if (viewMode === "mine") {
    const me = getCurrentUser();
    updateGardenTitle(me ? `${me.name}'s Garden` : "Your Garden");
  } else if (viewedGarden && viewedGarden.owner) {
    updateGardenTitle(`${viewedGarden.owner.name}'s Garden`);
  }

  updateFriendInfo();
  renderDecorations()
  renderGarden();
  renderVisitRecords();

  if (viewMode === "friend") {
    if (typeof createVisitorAvatar === "function" && avatarEl) {
      const gardenDiv = document.getElementById("garden");
      if (gardenDiv && avatarEl.parentNode !== gardenDiv) {
        gardenDiv.appendChild(avatarEl);
      }
    }

    if (typeof checkNearbyFlower === "function") {
      checkNearbyFlower();
    }
  }

  const hostVisitorSource =
    viewMode === "mine"
      ? viewedGarden.activeVisitors || []
      : (myGardenData && myGardenData.activeVisitors) || [];

  renderHostVisitors(hostVisitorSource);
  renderTodayFlower();
}

async function refreshSocialPanels() {
  if (!getCurrentUserId()) {
    return;
  }

  await renderAddFriendOptions();
  await renderFriendsList();

  if (viewMode === "friend" && currentVisitedFriendId) {
    const friends = await fetchFriends(getCurrentUserId());
    const stillFriend = friends.some((friend) => friend.id === currentVisitedFriendId);

    if (!stillFriend) {
      await loadMyGarden();
    }
  }
}

function startPolling() {
    stopPolling();
  
    pollTimer = setInterval(async () => {
      try {
        if (viewMode === "friend") {
          const viewedGarden = await fetchGarden(currentVisitedFriendId);
          applyViewedGardenData(viewedGarden);
  
          if (typeof checkNearbyFlower === "function") {
            checkNearbyFlower();
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, POLL_INTERVAL);
  }

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function submitMood(mood, eventText) {
  await createFlowerForUser(getCurrentUserId(), mood, eventText);

  viewMode = "mine";
  currentVisitedFriendId = null;
  friendMode = false;
  document.body.classList.remove("friend-mode");

  if (avatarEl) {
    avatarEl.remove();
    avatarEl = null;
  }

  activeFlowerId = null;
  selectedFlowerId = null;

  await refreshMineOnly();

  const eventInput = document.getElementById("eventInput");
  const moodSelect = document.getElementById("moodSelect");

  if (eventInput) {
    eventInput.value = "";
  }

  if (moodSelect) {
    moodSelect.value = "";
  }
}

async function loadMyGarden() {
  viewMode = "mine";
  currentVisitedFriendId = null;
  friendMode = false;

  document.body.classList.remove("friend-mode");
  const friendSection = document.getElementById("friendSection");
  if (friendSection) {
    friendSection.style.display = "none";
  }

  if (avatarEl) {
    avatarEl.remove();
    avatarEl = null;
  }

  activeFlowerId = null;
  selectedFlowerId = null;

  await refreshMineOnly();
}

async function showMyGarden() {
  if (viewMode === "friend" && currentVisitedFriendId) {
    try {
      await leaveVisit(currentVisitedFriendId, getCurrentUserId());
    } catch (err) {
      console.error("Leave visit error:", err);
    }
  }

  await loadMyGarden();
}

async function openFriendGardenById(friendId) {
  const friends = await fetchFriends(getCurrentUserId());
  const friend = friends.find((item) => item.id === friendId);

  if (!friend) {
    return;
  }

  if (viewMode === "friend" && currentVisitedFriendId && currentVisitedFriendId !== friendId) {
    try {
      await leaveVisit(currentVisitedFriendId, getCurrentUserId());
    } catch (err) {
      console.error("Leave previous friend garden error:", err);
    }
  }

  currentVisitedFriendId = friendId;
  viewMode = "friend";
  friendMode = true;
  selectedFlowerId = null;

  document.body.classList.add("friend-mode");

  const friendSection = document.getElementById("friendSection");
  if (friendSection) {
    friendSection.style.display = "block";
  }

  avatarX = 120;
  avatarY = 520;
  activeFlowerId = null;

  await startVisit(friendId, getCurrentUserId(), avatarX, avatarY);
  await refreshCurrentView();

  if (typeof createVisitorAvatar === "function") {
    createVisitorAvatar();
    checkNearbyFlower();
  }
}

async function addFriend(friendId) {
  const res = await fetch("/friends/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: getCurrentUserId(),
      friendId
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to add friend");
  }

  return data;
}

async function removeFriend(friendId) {
  const res = await fetch("/friends/remove", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: getCurrentUserId(),
      friendId
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to remove friend");
  }

  return data;
}

async function createNewUser(name, avatar) {
  const res = await fetch("/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      avatar
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to create user");
  }

  return data;
}

async function renderUserPicker() {
  const userListDiv = document.getElementById("userList");
  if (!userListDiv) {
    return;
  }

  userListDiv.innerHTML = "";

  try {
    const users = await fetchAllUsers();

    if (!users || users.length === 0) {
      userListDiv.innerHTML = `<p class="empty-message">No users yet 🌱</p>`;
      return;
    }

    users.forEach((user) => {
      const btn = document.createElement("button");
      btn.textContent = `${user.avatar} ${user.name}`;
      btn.addEventListener("click", async () => {
        try {
          if (viewMode === "friend" && currentVisitedFriendId) {
            try {
              await leaveVisit(currentVisitedFriendId, getCurrentUserId());
            } catch (err) {
              console.error("Leave on profile switch error:", err);
            }
          }

          setCurrentUserId(user.id);
          window.history.replaceState({}, "", `/?userId=${user.id}`);
          currentUserProfile = await fetchUser(getCurrentUserId());

          showAppMode();
          updateCurrentProfileText();
          await renderUserPicker();
          await renderAddFriendOptions();
          await renderFriendsList();
          await loadMyGarden();
          startPolling();
        } catch (err) {
          console.error("Profile switch error:", err);
          alert("Failed to switch profile");
        }
      });

      userListDiv.appendChild(btn);
    });
  } catch (err) {
    console.error("Render user picker error:", err);
    userListDiv.innerHTML = `<p class="empty-message">Failed to load users</p>`;
  }
}

async function renderAddFriendOptions() {
  const select = document.getElementById("addFriendSelect");
  if (!select) {
    return;
  }

  if (isAddFriendSelectOpen) {
    return;
  }

  const previousValue = select.value;

  try {
    const allUsers = await fetchAllUsers();
    const friends = await fetchFriends(getCurrentUserId());
    const friendIds = new Set((friends || []).map((friend) => friend.id));

    const candidates = allUsers
      .filter((user) => user.id !== getCurrentUserId())
      .filter((user) => !friendIds.has(user.id));

    select.innerHTML = `<option value="">Choose a user</option>`;

    candidates.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = `${user.avatar} ${user.name}`;
      select.appendChild(option);
    });

    const stillExists = candidates.some((user) => user.id === previousValue);
    if (stillExists) {
      select.value = previousValue;
    } else {
      select.value = "";
    }
  } catch (err) {
    console.error("Render add friend options error:", err);
    select.innerHTML = `<option value="">Failed to load users</option>`;
  }
}

async function renderFriendsList() {
  const friendsListDiv = document.getElementById("friendsList");
  if (!friendsListDiv) {
    return;
  }

  friendsListDiv.innerHTML = "";

  try {
    const friends = await fetchFriends(getCurrentUserId());

    if (!friends || friends.length === 0) {
      friendsListDiv.innerHTML = `<p class="empty-message">No friends yet 🌱</p>`;
      return;
    }

    friends.forEach((friend) => {
      const item = document.createElement("div");
      item.className = "friend-item";

      const infoDiv = document.createElement("div");
      infoDiv.innerHTML = `
        <div class="friend-name">${friend.avatar} ${friend.name}</div>
      `;

      const actionGroup = document.createElement("div");
      actionGroup.style.display = "flex";
      actionGroup.style.gap = "8px";
      actionGroup.style.flexWrap = "wrap";
      actionGroup.style.justifyContent = "flex-end";

      const openBtn = document.createElement("button");
      openBtn.className = "friend-open-btn";
      openBtn.textContent = "Visit";

      openBtn.addEventListener("click", async () => {
        try {
          await openFriendGardenById(friend.id);
        } catch (err) {
          console.error("Open friend garden error:", err);
        }
      });

      const removeBtn = document.createElement("button");
      removeBtn.className = "friend-open-btn";
      removeBtn.textContent = "Remove";

      removeBtn.addEventListener("click", async () => {
        try {
          await removeFriend(friend.id);

          if (viewMode === "friend" && currentVisitedFriendId === friend.id) {
            await loadMyGarden();
          }

          await renderAddFriendOptions();
          await renderFriendsList();
        } catch (err) {
          console.error("Remove friend error:", err);
          alert("Failed to remove friend");
        }
      });

      actionGroup.appendChild(openBtn);
      actionGroup.appendChild(removeBtn);

      item.appendChild(infoDiv);
      item.appendChild(actionGroup);
      friendsListDiv.appendChild(item);
    });
  } catch (err) {
    console.error("Friends render error:", err);
    friendsListDiv.innerHTML = `<p class="empty-message">Failed to load friends</p>`;
  }
}

function setupSubmitButton() {
  const submitBtn = document.getElementById("submitBtn");
  if (!submitBtn) {
    return;
  }

  submitBtn.addEventListener("click", async () => {
    try {
      const moodSelect = document.getElementById("moodSelect");
      const eventInput = document.getElementById("eventInput");

      const eventText = eventInput ? eventInput.value.trim() : "";
      let mood = moodSelect ? moodSelect.value : "";

      if (!mood && eventText) {
        mood = analyzeMoodFromText(eventText);
      }

      if (!mood) {
        alert("Please write what happened today or choose your mood 🌼");
        return;
      }

      await submitMood(mood, eventText);
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to bloom a flower");
    }
  });
}
function setupVisitorChoices() {
    const visitorButtons = document.querySelectorAll(".visitor-choice");
    const selectedVisitorText = document.getElementById("selectedVisitorText");
  
    visitorButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const avatar = btn.dataset.avatar;
  
        setVisitorAvatar(avatar);
  
        visitorButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
  
        if (selectedVisitorText) {
          selectedVisitorText.textContent = `Current form: ${avatar}`;
        }
  
        if (viewMode === "friend" && currentVisitedFriendId) {
          if (!avatarEl && typeof createVisitorAvatar === "function") {
            createVisitorAvatar();
          }
  
          if (avatarEl) {
            avatarEl.textContent = avatar;
          }
  
          try {
            await moveVisit(currentVisitedFriendId, getCurrentUserId(), avatarX, avatarY);
          } catch (err) {
            console.error("Avatar update move error:", err);
          }
  
          if (typeof checkNearbyFlower === "function") {
            checkNearbyFlower();
          }
        }
      });
    });
  
    const defaultBtn = Array.from(visitorButtons).find(
      (btn) => btn.dataset.avatar === getSelectedVisitorAvatar()
    );
  
    if (defaultBtn) {
      defaultBtn.classList.add("active");
    }
  }

function setupGardenSwitchButtons() {
  const backMyGardenBtn = document.getElementById("backMyGardenBtn");

  if (backMyGardenBtn) {
    backMyGardenBtn.addEventListener("click", async () => {
      try {
        await showMyGarden();
      } catch (err) {
        console.error("Back to my garden error:", err);
      }
    });
  }
}

function setupCreateUserButton() {
  const createBtn = document.getElementById("createUserBtn");
  if (!createBtn) {
    return;
  }

  createBtn.addEventListener("click", async () => {
    const nameInput = document.getElementById("newUserName");
    const avatarSelect = document.getElementById("newUserAvatar");

    const name = nameInput ? nameInput.value.trim() : "";
    const avatar = avatarSelect ? avatarSelect.value : "🦋";

    if (!name) {
      alert("Please enter a name");
      return;
    }

    try {
      const newUser = await createNewUser(name, avatar);

      setCurrentUserId(newUser.id);
      window.history.replaceState({}, "", `/?userId=${newUser.id}`);
      currentUserProfile = await fetchUser(getCurrentUserId());

      if (nameInput) {
        nameInput.value = "";
      }

      showAppMode();
      updateCurrentProfileText();
      await renderUserPicker();
      await renderAddFriendOptions();
      await renderFriendsList();
      await loadMyGarden();
      startPolling();
    } catch (err) {
      console.error("Create user error:", err);
      alert(err.message || "Failed to create user");
    }
  });
}

function setupAddFriendButton() {
  const addBtn = document.getElementById("addFriendBtn");
  if (!addBtn) {
    return;
  }

  addBtn.addEventListener("click", async () => {
    const select = document.getElementById("addFriendSelect");
    const friendId = select ? select.value : "";

    if (!friendId) {
      alert("Please choose a user to add");
      return;
    }

    try {
      await addFriend(friendId);
      await renderAddFriendOptions();
      await renderFriendsList();
    } catch (err) {
      console.error("Add friend error:", err);
      alert(err.message || "Failed to add friend");
    }
  });
}

function setupBeforeUnload() {
  window.addEventListener("beforeunload", () => {
    if (viewMode === "friend" && currentVisitedFriendId) {
      fetch("/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          hostUserId: currentVisitedFriendId,
          visitorUserId: getCurrentUserId(),
          visitorAvatar: getSelectedVisitorAvatar()
        }),
        keepalive: true
      }).catch(() => {});
    }
  });
}

async function init() {
  try {
    setupCreateUserButton();
    setupAddFriendButton();
    setupSubmitButton();
    setupVisitorChoices();
    setupGardenSwitchButtons();
    setupBeforeUnload();
    setupAddFriendSelectLock();

    if (typeof setupGardenClickMove === "function") {
      setupGardenClickMove();
    }

    if (typeof setupFriendFlowerActions === "function") {
      setupFriendFlowerActions();
    }

    await renderUserPicker();

    if (!getCurrentUserId()) {
      showAuthMode();
      return;
    }

    try {
      currentUserProfile = await fetchUser(getCurrentUserId());
    } catch (err) {
      console.error("Invalid saved user, returning to auth mode:", err);
      clearCurrentUserId();
      showAuthMode();
      await renderUserPicker();
      return;
    }

    showAppMode();
    updateCurrentProfileText();
    await renderAddFriendOptions();
    await renderFriendsList();
    await loadMyGarden();
    startPolling();
  } catch (err) {
    console.error("Init error:", err);
    alert("Failed to initialize app");
  }
}

if (typeof window !== "undefined") {
  window.onload = init;
}

function showAuthMode() {
  const authSection = document.getElementById("authSection");
  const rightPanel = document.querySelector(".right-panel");

  if (authSection) authSection.style.display = "block";
  if (rightPanel) rightPanel.style.display = "none";

  [
    "currentProfileSection",
    "friendManageSection",
    "friendsListSection",
    "friendSection",
    "visitRecordsSection",
    "visitorSection",
    "todayFlower"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const checkin = document.querySelector(".checkin-section");
  if (checkin) checkin.style.display = "none";
}

function showAppMode() {
  const authSection = document.getElementById("authSection");
  const rightPanel = document.querySelector(".right-panel");

  if (authSection) authSection.style.display = "none";
  if (rightPanel) rightPanel.style.display = "block";

  [
    "currentProfileSection",
    "friendManageSection",
    "friendsListSection",
    "visitRecordsSection",
    "visitorSection",
    "todayFlower"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "block";
  });

  const friendSection = document.getElementById("friendSection");
  if (friendSection) {
    friendSection.style.display = "none";
  }

  const checkin = document.querySelector(".checkin-section");
  if (checkin) checkin.style.display = "block";
}

function setupAddFriendSelectLock() {
  const select = document.getElementById("addFriendSelect");
  if (!select) {
    return;
  }

  select.addEventListener("focus", () => {
    isAddFriendSelectOpen = true;
  });

  select.addEventListener("mousedown", () => {
    isAddFriendSelectOpen = true;
  });

  select.addEventListener("change", () => {
    isAddFriendSelectOpen = false;
  });

  select.addEventListener("blur", () => {
    isAddFriendSelectOpen = false;
  });
}


function __setMainTestState(patch) {
  if ("currentGardenView" in patch) currentGardenView = patch.currentGardenView;
  if ("currentViewedGardenData" in patch) currentViewedGardenData = patch.currentViewedGardenData;
  if ("myGardenData" in patch) myGardenData = patch.myGardenData;
  if ("currentVisitedFriendId" in patch) currentVisitedFriendId = patch.currentVisitedFriendId;
  if ("viewMode" in patch) viewMode = patch.viewMode;
  if ("selectedFlowerId" in patch) selectedFlowerId = patch.selectedFlowerId;
  if ("isAddFriendSelectOpen" in patch) isAddFriendSelectOpen = patch.isAddFriendSelectOpen;

  if ("currentUserProfile" in patch) {
    currentUserProfile = patch.currentUserProfile;
  }
}

function __getMainTestState() {
  return {
    currentGardenView,
    currentViewedGardenData,
    myGardenData,
    currentVisitedFriendId,
    viewMode,
    selectedFlowerId,
    isAddFriendSelectOpen,
    currentUserProfile
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    updateGardenTitle,
    updateCurrentProfileText,
    getMyGarden,
    getCurrentViewedUserId,
    applyViewedGardenData,
    applyMyGardenData,
    updateFriendInfo,
    renderVisitRecords,
    renderHostVisitors,
    showAuthMode,
    showAppMode,
    setupAddFriendSelectLock,
    __setMainTestState,
    __getMainTestState,
    refreshSocialPanels,
    startPolling,
    stopPolling,
    loadMyGarden,
    showMyGarden,
    setupGardenSwitchButtons,
    setupSubmitButton,
    setupCreateUserButton,
    setupAddFriendButton
  };
}