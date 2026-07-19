import {
    useCallback,
    useEffect,
    useState
  } from "react";
  
  import { apiRequest } from "../api";
  
  function FriendRequests({
    currentUser
  }) {
    const [
      incomingRequests,
      setIncomingRequests
    ] = useState([]);
  
    const [
      outgoingRequests,
      setOutgoingRequests
    ] = useState([]);
  
    const [isLoading, setIsLoading] =
      useState(false);
  
    const [message, setMessage] =
      useState("");
  
    const [
      processingRequestId,
      setProcessingRequestId
    ] = useState("");
  
    const loadRequests = useCallback(
      async () => {
        if (!currentUser?.id) {
          setIncomingRequests([]);
          setOutgoingRequests([]);
          return;
        }
  
        try {
          setIsLoading(true);
          setMessage("");
  
          const data = await apiRequest(
            `/friends/requests/${encodeURIComponent(
              currentUser.id
            )}`
          );
  
          setIncomingRequests(
            Array.isArray(data?.incoming)
              ? data.incoming
              : []
          );
  
          setOutgoingRequests(
            Array.isArray(data?.outgoing)
              ? data.outgoing
              : []
          );
        } catch (error) {
          console.error(
            "Load friend requests error:",
            error
          );
  
          setIncomingRequests([]);
          setOutgoingRequests([]);
  
          setMessage(
            error.message ||
              "Failed to load friend requests."
          );
        } finally {
          setIsLoading(false);
        }
      },
      [currentUser?.id]
    );
  
    useEffect(() => {
      loadRequests();
    }, [loadRequests]);
  
    async function handleAccept(request) {
      if (
        !request?.id ||
        !currentUser?.id
      ) {
        return;
      }
  
      try {
        setProcessingRequestId(
          String(request.id)
        );
  
        setMessage("");
  
        const response = await apiRequest(
          `/friends/requests/${encodeURIComponent(
            request.id
          )}/accept`,
          {
            method: "POST",
            body: JSON.stringify({
              userId: currentUser.id
            })
          }
        );
  
        setIncomingRequests(
          (currentRequests) =>
            currentRequests.filter(
              (item) =>
                String(item.id) !==
                String(request.id)
            )
        );
  
        setMessage(
          response?.message ||
            "Friend request accepted."
        );
      } catch (error) {
        console.error(
          "Accept friend request error:",
          error
        );
  
        setMessage(
          error.message ||
            "Failed to accept friend request."
        );
      } finally {
        setProcessingRequestId("");
      }
    }
  
    async function handleReject(request) {
      if (
        !request?.id ||
        !currentUser?.id
      ) {
        return;
      }
  
      try {
        setProcessingRequestId(
          String(request.id)
        );
  
        setMessage("");
  
        const response = await apiRequest(
          `/friends/requests/${encodeURIComponent(
            request.id
          )}/reject`,
          {
            method: "POST",
            body: JSON.stringify({
              userId: currentUser.id
            })
          }
        );
  
        setIncomingRequests(
          (currentRequests) =>
            currentRequests.filter(
              (item) =>
                String(item.id) !==
                String(request.id)
            )
        );
  
        setMessage(
          response?.message ||
            "Friend request rejected."
        );
      } catch (error) {
        console.error(
          "Reject friend request error:",
          error
        );
  
        setMessage(
          error.message ||
            "Failed to reject friend request."
        );
      } finally {
        setProcessingRequestId("");
      }
    }
  
    return (
      <section id="friendRequestsSection">
        <h2>Friend Requests</h2>
  
        {isLoading && (
          <p className="auth-message">
            Loading friend requests...
          </p>
        )}
  
        {!isLoading && message && (
          <p className="auth-message">
            {message}
          </p>
        )}
  
        <h3 className="friend-request-subheading">
          Incoming Requests
        </h3>
  
        <div id="friendRequestsList">
          {!isLoading &&
          incomingRequests.length === 0 ? (
            <p className="empty-message">
              No pending requests 🌱
            </p>
          ) : (
            incomingRequests.map(
              (request) => {
                const sender =
                  request.sender || {};
  
                const isProcessing =
                  String(
                    processingRequestId
                  ) ===
                  String(request.id);
  
                return (
                  <article
                    key={request.id}
                    className="friend-request-item"
                  >
                    <div className="friend-request-info">
                      <strong>
                        {sender.avatar || "🦋"}{" "}
                        {sender.name ||
                          "PetalPal user"}
                      </strong>
  
                      <span>
                        sent you a friend request
                      </span>
                    </div>
  
                    <div className="friend-request-actions">
                      <button
                        type="button"
                        className="
                          friend-request-button
                          friend-request-accept
                        "
                        disabled={isProcessing}
                        onClick={() =>
                          handleAccept(request)
                        }
                      >
                        {isProcessing
                          ? "Working..."
                          : "Accept"}
                      </button>
  
                      <button
                        type="button"
                        className="
                          friend-request-button
                          friend-request-decline
                        "
                        disabled={isProcessing}
                        onClick={() =>
                          handleReject(request)
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                );
              }
            )
          )}
        </div>
  
        <h3 className="friend-request-subheading">
          Outgoing Requests
        </h3>
  
        <div id="sentFriendRequestsList">
          {!isLoading &&
          outgoingRequests.length === 0 ? (
            <p className="empty-message">
              No outgoing requests
            </p>
          ) : (
            outgoingRequests.map(
              (request) => {
                const receiver =
                  request.receiver || {};
  
                return (
                  <article
                    key={request.id}
                    className="
                      friend-request-item
                      friend-request-sent
                    "
                  >
                    <div className="friend-request-info">
                      <strong>
                        {receiver.avatar ||
                          "🦋"}{" "}
                        {receiver.name ||
                          "PetalPal user"}
                      </strong>
  
                      <span>
                        You sent this user a
                        friend request.
                      </span>
  
                      <span className="friend-request-status">
                        Pending
                      </span>
                    </div>
                  </article>
                );
              }
            )
          )}
        </div>
  
        {!isLoading && (
          <button
            type="button"
            className="friend-refresh-btn"
            onClick={loadRequests}
          >
            Refresh Requests
          </button>
        )}
      </section>
    );
  }
  
  export default FriendRequests;