import { useState } from "react";
import { apiRequest } from "../api";

function FriendSearch({
  currentUser,
  onRequestSent = () => {}
}) {
  const [searchText, setSearchText] =
    useState("");

  const [results, setResults] =
    useState([]);

  const [message, setMessage] =
    useState("");

  const [isSearching, setIsSearching] =
    useState(false);

  const [sendingUserId, setSendingUserId] =
    useState("");

  function normalizeUsers(data) {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.users)) {
      return data.users;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    if (Array.isArray(data?.matches)) {
      return data.matches;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  }

  function removeCurrentUser(users) {
    const currentUserId = String(
      currentUser?.id || ""
    );

    return users.filter((user) => {
      if (!user?.id) {
        return false;
      }

      return (
        String(user.id) !== currentUserId
      );
    });
  }

  function isAlreadyFriend(user) {
    const status = String(
      user?.friendStatus ||
        user?.relationshipStatus ||
        user?.status ||
        ""
    ).toLowerCase();

    return (
      user?.isFriend === true ||
      user?.alreadyFriends === true ||
      user?.areFriends === true ||
      status === "accepted" ||
      status === "friend" ||
      status === "friends"
    );
  }

  function hasPendingRequest(user) {
    const status = String(
      user?.requestStatus ||
        user?.friendRequestStatus ||
        ""
    ).toLowerCase();

    return (
      user?.requestSent === true ||
      user?.friendRequestSent === true ||
      user?.hasPendingRequest === true ||
      status === "pending" ||
      status === "sent"
    );
  }

  async function searchUsers(searchValue) {
    const encodedName =
      encodeURIComponent(searchValue);

    const encodedCurrentUserId =
      encodeURIComponent(currentUser.id);

    const data = await apiRequest(
      `/users/search?name=${encodedName}` +
        `&currentUserId=${encodedCurrentUserId}`
    );

    return removeCurrentUser(
      normalizeUsers(data)
    );
  }

  async function handleSearch(event) {
    event.preventDefault();

    const trimmedSearch =
      searchText.trim();

    if (!currentUser?.id) {
      setResults([]);
      setMessage("Please log in first.");
      return;
    }

    if (!trimmedSearch) {
      setResults([]);
      setMessage(
        "Please enter a display name."
      );
      return;
    }

    try {
      setIsSearching(true);
      setMessage("");
      setResults([]);

      const users = await searchUsers(
        trimmedSearch
      );

      setResults(users);

      if (users.length === 0) {
        setMessage(
          "No matching users found."
        );
      }
    } catch (error) {
      console.error(
        "Search friends error:",
        error
      );

      setResults([]);

      setMessage(
        error.message ||
          "Failed to search users."
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSendRequest(user) {
    if (!currentUser?.id || !user?.id) {
      setMessage(
        "Unable to send this friend request."
      );
      return;
    }

    if (
      String(currentUser.id) ===
      String(user.id)
    ) {
      setMessage(
        "You cannot add yourself as a friend."
      );
      return;
    }

    if (isAlreadyFriend(user)) {
      setMessage(
        `You and ${
          user.name ||
          user.displayName ||
          "this user"
        } are already friends.`
      );
      return;
    }

    if (hasPendingRequest(user)) {
      setMessage(
        "A friend request is already pending."
      );
      return;
    }

    try {
      setSendingUserId(String(user.id));
      setMessage("");

      const response = await apiRequest(
        "/friends/request",
        {
          method: "POST",
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: user.id
          })
        }
      );

      setResults((currentResults) =>
        currentResults.map((item) =>
          String(item.id) ===
          String(user.id)
            ? {
                ...item,
                requestSent: true,
                requestStatus: "pending"
              }
            : item
        )
      );

      setMessage(
        response?.message ||
          `Friend request sent to ${
            user.name ||
            user.displayName ||
            "this user"
          }.`
      );

      onRequestSent(
        response?.request ||
          response ||
          null
      );
    } catch (error) {
      console.error(
        "Send friend request error:",
        error
      );

      const errorMessage =
        error.message ||
        "Failed to send friend request.";

      const normalizedError =
        errorMessage.toLowerCase();

      if (
        normalizedError.includes(
          "already friends"
        )
      ) {
        setResults((currentResults) =>
          currentResults.map((item) =>
            String(item.id) ===
            String(user.id)
              ? {
                  ...item,
                  isFriend: true,
                  friendStatus: "accepted"
                }
              : item
          )
        );
      } else if (
        normalizedError.includes(
          "already pending"
        ) ||
        normalizedError.includes(
          "already sent"
        ) ||
        normalizedError.includes(
          "request exists"
        )
      ) {
        setResults((currentResults) =>
          currentResults.map((item) =>
            String(item.id) ===
            String(user.id)
              ? {
                  ...item,
                  requestSent: true,
                  requestStatus: "pending"
                }
              : item
          )
        );
      }

      setMessage(errorMessage);
    } finally {
      setSendingUserId("");
    }
  }

  return (
    <section id="friendManageSection">
      <h2>Find Friends</h2>

      <form onSubmit={handleSearch}>
        <label htmlFor="friendSearchInput">
          Search by display name
        </label>

        <input
          id="friendSearchInput"
          type="text"
          placeholder="Enter a friend's name"
          autoComplete="off"
          value={searchText}
          disabled={isSearching}
          onChange={(event) => {
            setSearchText(
              event.target.value
            );

            setMessage("");
          }}
        />

        <button
          id="friendSearchBtn"
          type="submit"
          disabled={
            isSearching ||
            !searchText.trim()
          }
        >
          {isSearching
            ? "Searching..."
            : "Search"}
        </button>
      </form>

      {message && (
        <p
          id="friendSearchMessage"
          className="auth-message"
        >
          {message}
        </p>
      )}

      <div id="friendSearchResults">
        {results.map((user) => {
          const alreadyFriend =
            isAlreadyFriend(user);

          const requestPending =
            hasPendingRequest(user);

          const isSending =
            String(sendingUserId) ===
            String(user.id);

          let buttonText = "Add Friend";

          if (isSending) {
            buttonText = "Sending...";
          } else if (alreadyFriend) {
            buttonText = "Already Friends";
          } else if (requestPending) {
            buttonText = "Request Sent";
          }

          return (
            <article
              key={user.id}
              className="friend-item"
            >
              <div className="friend-name">
                <span>
                  {user.avatar || "🦋"}
                </span>

                <span>
                  {user.name ||
                    user.displayName ||
                    "PetalPal user"}
                </span>
              </div>

              <button
                className="friend-open-btn"
                type="button"
                disabled={
                  isSending ||
                  alreadyFriend ||
                  requestPending
                }
                onClick={() =>
                  handleSendRequest(user)
                }
              >
                {buttonText}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default FriendSearch;