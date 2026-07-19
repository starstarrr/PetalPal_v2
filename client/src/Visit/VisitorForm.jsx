import {
    useEffect,
    useState
  } from "react";
  
  import { apiRequest } from "../api";
  
  const AVATAR_OPTIONS = [
    {
      avatar: "🐦",
      label: "Bird"
    },
    {
      avatar: "🐝",
      label: "Bee"
    },
    {
      avatar: "🦋",
      label: "Butterfly"
    }
  ];
  
  function VisitorForm({
    currentUser,
    onAvatarChange
  }) {
    const [
      selectedAvatar,
      setSelectedAvatar
    ] = useState(
      currentUser?.avatar || "🦋"
    );
  
    const [
      savingAvatar,
      setSavingAvatar
    ] = useState(false);
  
    const [
      avatarError,
      setAvatarError
    ] = useState("");
  
    useEffect(() => {
      setSelectedAvatar(
        currentUser?.avatar || "🦋"
      );
    }, [currentUser?.avatar]);
  
    async function changeAvatar(avatar) {
      if (!avatar) {
        return;
      }
  
      /*
       * 先立刻更新 React 页面。
       * 不要等待服务器请求结束，否则请求失败时
       * 花园中的形象完全不会变化。
       */
      setSelectedAvatar(avatar);
      setAvatarError("");
  
      if (onAvatarChange) {
        onAvatarChange(avatar);
      }
  
      if (!currentUser?.id) {
        return;
      }
  
      try {
        setSavingAvatar(true);
  
        await apiRequest(
          "/users/avatar",
          {
            method: "PUT",
  
            body: JSON.stringify({
              userId: currentUser.id,
              avatar
            })
          }
        );
      } catch (error) {
        console.error(
          "Change avatar error:",
          error
        );
  
        /*
         * 暂时不恢复旧头像。
         * 即使服务器保存失败，本次页面中的头像
         * 仍然可以正常切换和移动。
         */
        setAvatarError(
          "Avatar changed for this session, but could not be saved."
        );
      } finally {
        setSavingAvatar(false);
      }
    }
  
    return (
      <section id="visitorSection">
        <h2>
          Choose Your Garden Form
        </h2>
  
        <div id="visitorChoices">
          {AVATAR_OPTIONS.map(
            ({ avatar, label }) => (
              <button
                key={avatar}
                className={`visitor-choice ${
                  selectedAvatar === avatar
                    ? "active"
                    : ""
                }`}
                type="button"
                aria-pressed={
                  selectedAvatar === avatar
                }
                onClick={() =>
                  changeAvatar(avatar)
                }
              >
                <span
                  aria-hidden="true"
                >
                  {avatar}
                </span>{" "}
                {label}
              </button>
            )
          )}
        </div>
  
        <p id="selectedVisitorText">
          Current form:{" "}
          <span aria-hidden="true">
            {selectedAvatar}
          </span>
        </p>
  
        {savingAvatar && (
          <p className="visitor-avatar-status">
            Saving form...
          </p>
        )}
  
        {avatarError && (
          <p
            className="visitor-avatar-error"
            role="alert"
          >
            {avatarError}
          </p>
        )}
      </section>
    );
  }
  
  export default VisitorForm;