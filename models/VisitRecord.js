class VisitRecord {
    constructor({ visitorId, visitorName, visitorAvatar, action }) {
      this.id = Date.now() + Math.floor(Math.random() * 100000);
      this.visitorId = visitorId;
      this.visitorName = visitorName;
      this.visitorAvatar = visitorAvatar;
      this.action = action;
      this.time = new Date().toLocaleString();
    }
  }
  export default VisitRecord;