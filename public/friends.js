const search =
  typeof window !== "undefined" && window.location
    ? window.location.search
    : "";

const params = new URLSearchParams(search);

let currentUserId = params.get("userId") || null;
let currentUserProfile = null;

function setCurrentUserId(userId) {
  currentUserId = userId;
}

function clearCurrentUserId() {
  currentUserId = null;
}

function getCurrentUserId() {
  return currentUserId;
}

function getCurrentUser() {
  return currentUserProfile;
}

async function apiGet(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`GET ${url} failed`);
  }

  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body || {})
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `POST ${url} failed`);
  }

  return data;
}

async function apiDelete(url) {
  const res = await fetch(url, {
    method: "DELETE"
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `DELETE ${url} failed`);
  }

  return data;
}

async function fetchAllUsers() {
  return apiGet("/users");
}

async function fetchUser(userId) {
  return apiGet(`/users/${userId}`);
}

async function fetchFriends(userId) {
  return apiGet(`/users/${userId}/friends`);
}

async function fetchGarden(userId) {
    if (!userId) {
        throw new Error("User ID is required");
      }
    
      const res = await fetch(
        `/users/${encodeURIComponent(userId)}/garden?t=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache"
          }
        }
      );
    
      const data = await res.json();
    
      if (!res.ok) {
        throw new Error(
          data.error || "Failed to fetch garden"
        );
      }
    
      return data;
}

async function createUser(name, avatar) {
  return apiPost("/users", { name, avatar });
}

async function addFriend(userId, friendId) {
  return apiPost("/friends/add", { userId, friendId });
}

async function removeFriend(userId, friendId) {
  return apiPost("/friends/remove", { userId, friendId });
}

async function createFlowerForUser(userId, mood, event) {
  return apiPost(`/users/${userId}/flowers`, { mood, event });
}

async function supportFlowerForUser(
    userId,
    flowerId,
    visitorUserId,
    visitorAvatar
  ) {
    return apiPost(
      `/users/${userId}/flowers/${flowerId}/support`,
      {
        visitorUserId,
        visitorAvatar
      }
    );
  }

  async function messageFlowerForUser(
    userId,
    flowerId,
    author,
    text,
    visitorUserId,
    visitorAvatar
  ) {
    return apiPost(
      `/users/${userId}/flowers/${flowerId}/message`,
      {
        author,
        text,
        visitorUserId,
        visitorAvatar
      }
    );
  }

async function deleteFlowerForUser(userId, flowerId) {
  return apiDelete(`/users/${userId}/flowers/${flowerId}`);
}

async function startVisit(hostUserId, visitorUserId, x = 120, y = 520) {
  return apiPost("/visit", {
    hostUserId,
    visitorUserId,
    visitorAvatar:
      typeof getSelectedVisitorAvatar === "function"
        ? getSelectedVisitorAvatar()
        : "🦋",
    x,
    y
  });
}

async function moveVisit(hostUserId, visitorUserId, x, y) {
  return apiPost("/visit/move", {
    hostUserId,
    visitorUserId,
    visitorAvatar:
      typeof getSelectedVisitorAvatar === "function"
        ? getSelectedVisitorAvatar()
        : "🦋",
    x,
    y
  });
}

async function leaveVisit(hostUserId, visitorUserId) {
  return apiPost("/leave", {
    hostUserId,
    visitorUserId,
    visitorAvatar:
      typeof getSelectedVisitorAvatar === "function"
        ? getSelectedVisitorAvatar()
        : "🦋"
  });
}
if (typeof module !== "undefined") {
  module.exports = {
    setCurrentUserId,
    clearCurrentUserId,
    getCurrentUserId,
    getCurrentUser,
    apiGet,
    apiPost,
    apiDelete,
    fetchAllUsers,
    fetchUser,
    fetchFriends,
    fetchGarden,
    createUser,
    addFriend,
    removeFriend,
    createFlowerForUser,
    supportFlowerForUser,
    messageFlowerForUser,
    deleteFlowerForUser,
    startVisit,
    moveVisit,
    leaveVisit
  };
}