function CurrentProfile({ user, onLogout }) {
    return (
      <section id="currentProfileSection">
        <h2>Current Profile</h2>
  
        <p id="currentProfileText">
          {user
            ? `${user.avatar || "🦋"} ${user.name}`
            : "Not logged in"}
        </p>
  
        <button
          id="logoutBtn"
          type="button"
          onClick={onLogout}
        >
          Log Out
        </button>
      </section>
    );
  }
  
  export default CurrentProfile;