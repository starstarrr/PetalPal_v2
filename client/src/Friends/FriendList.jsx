import {
    useCallback,
    useEffect,
    useState
  } from "react";
  
  import { apiRequest } from "../api";
  
  function FriendList({
    currentUser,
    onVisitFriend = null
  }) {
    const [friends, setFriends] =
      useState([]);
  
    const [isLoading, setIsLoading] =
      useState(false);
  
    const [message, setMessage] =
      useState("");
  
    const [
      openingFriendId,
      setOpeningFriendId
    ] = useState("");
  
    const [
      removingFriendId,
      setRemovingFriendId
    ] = useState("");
  
    function normalizeFriend(friend) {
      if (!friend) {
        return null;
      }
  
      if (friend.friend?.id) {
        return friend.friend;
      }
  
      if (friend.user?.id) {
        return friend.user;
      }
  
      if (friend.otherUser?.id) {
        return friend.otherUser;
      }
  
      if (
        friend.sender?.id &&
        friend.receiver?.id
      ) {
        const currentUserId = String(
          currentUser?.id || ""
        );
  
        if (
          String(friend.sender.id) ===
          currentUserId
        ) {
          return friend.receiver;
        }
  
        return friend.sender;
      }
  
      if (friend.id) {
        return friend;
      }
  
      return null;
    }
  
    function normalizeFriends(data) {
      let rawFriends = [];
  
      if (Array.isArray(data)) {
        rawFriends = data;
      } else if (
        Array.isArray(data?.friends)
      ) {
        rawFriends = data.friends;
      } else if (
        Array.isArray(data?.results)
      ) {
        rawFriends = data.results;
      } else if (
        Array.isArray(data?.users)
      ) {
        rawFriends = data.users;
      } else if (
        Array.isArray(data?.data)
      ) {
        rawFriends = data.data;
      }
  
      const normalizedFriends =
        rawFriends
          .map((friend) =>
            normalizeFriend(friend)
          )
          .filter(Boolean)
          .filter(
            (friend) =>
              String(friend.id) !==
              String(currentUser?.id)
          );
  
      return Array.from(
        new Map(
          normalizedFriends.map((friend) => [
            String(friend.id),
            friend
          ])
        ).values()
      );
    }
  
    const loadFriends = useCallback(
      async () => {
        if (!currentUser?.id) {
          setFriends([]);
          setMessage("");
          return;
        }
  
        try {
          setIsLoading(true);
          setMessage("");
  
          const data = await apiRequest(
            `/users/${encodeURIComponent(
              currentUser.id
            )}/friends`
          );
  
          const loadedFriends =
            normalizeFriends(data);
  
          setFriends(loadedFriends);
  
          if (loadedFriends.length === 0) {
            setMessage(
              "You have not added any friends yet."
            );
          }
        } catch (error) {
          console.error(
            "Load friends error:",
            error
          );
  
          setFriends([]);
  
          setMessage(
            error.message ||
              "Failed to load friends."
          );
        } finally {
          setIsLoading(false);
        }
      },
      [currentUser?.id]
    );
  
    useEffect(() => {
      loadFriends();
    }, [loadFriends]);
  
    async function handleVisitFriend(friend) {
      if (!friend?.id) {
        return;
      }
  
      try {
        setOpeningFriendId(
          String(friend.id)
        );
  
        setMessage("");
  
        if (
          typeof onVisitFriend ===
          "function"
        ) {
          await onVisitFriend(friend);
          return;
        }
  
        setMessage(
          "Garden visiting has not been connected yet."
        );
      } catch (error) {
        console.error(
          "Visit friend error:",
          error
        );
  
        setMessage(
          error.message ||
            "Failed to open this garden."
        );
      } finally {
        setOpeningFriendId("");
      }
    }
  
    async function handleRemoveFriend(friend) {
      if (
        !currentUser?.id ||
        !friend?.id
      ) {
        return;
      }
  
      const confirmed = window.confirm(
        `Remove ${
          friend.name ||
          friend.displayName ||
          "this friend"
        } from your friends list?`
      );
  
      if (!confirmed) {
        return;
      }
  
      try {
        setRemovingFriendId(
          String(friend.id)
        );
  
        setMessage("");
  
        const response = await apiRequest(
          "/friends/remove",
          {
            method: "POST",
            body: JSON.stringify({
              userId: currentUser.id,
              friendId: friend.id
            })
          }
        );
  
        setFriends((currentFriends) =>
          currentFriends.filter(
            (item) =>
              String(item.id) !==
              String(friend.id)
          )
        );
  
        setMessage(
          response?.message ||
            "Friend removed successfully."
        );
      } catch (error) {
        console.error(
          "Remove friend error:",
          error
        );
  
        setMessage(
          error.message ||
            "Failed to remove friend."
        );
      } finally {
        setRemovingFriendId("");
      }
    }
  
    return (
      <section id="friendsListSection">
        <h2>Friends</h2>
  
        {isLoading && (
          <p className="auth-message">
            Loading friends...
          </p>
        )}
  
        {!isLoading && message && (
          <p
            id="friendsListMessage"
            className="auth-message"
          >
            {message}
          </p>
        )}
  
        <div id="friendsList">
          {friends.map((friend) => {
            const isOpening =
              String(openingFriendId) ===
              String(friend.id);
  
            const isRemoving =
              String(removingFriendId) ===
              String(friend.id);
  
            return (
              <article
                key={friend.id}
                className="friend-item"
              >
                <div className="friend-name">
                  <span>
                    {friend.avatar || "🦋"}
                  </span>
  
                  <span>
                    {friend.name ||
                      friend.displayName ||
                      "PetalPal user"}
                  </span>
                </div>
  
                <div className="friend-actions">
                  <button
                    className="friend-open-btn"
                    type="button"
                    disabled={
                      isOpening ||
                      isRemoving
                    }
                    onClick={() =>
                      handleVisitFriend(friend)
                    }
                  >
                    {isOpening
                      ? "Opening..."
                      : "Visit Garden"}
                  </button>
  
                  <button
                    className="friend-remove-btn"
                    type="button"
                    disabled={
                      isOpening ||
                      isRemoving
                    }
                    onClick={() =>
                      handleRemoveFriend(friend)
                    }
                  >
                    {isRemoving
                      ? "Removing..."
                      : "Remove"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
  
        {!isLoading && (
          <button
            type="button"
            className="friend-refresh-btn"
            onClick={loadFriends}
          >
            Refresh Friends
          </button>
        )}
      </section>
    );
  }
  
  export default FriendList;