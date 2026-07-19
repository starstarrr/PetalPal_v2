function FriendStatus() {
    return (
      <section
        id="friendInfo"
        className="below-garden-card friend-status-panel"
        style={{ display: "none" }}
      >
        <h2>Friend Status</h2>
  
        <p id="friendMood">
          Mood: Unknown
        </p>
  
        <p id="friendTodayFlower">
          Today&apos;s flower: None
        </p>
      </section>
    );
  }
  
  export default FriendStatus;