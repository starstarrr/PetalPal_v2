class Garden {
  constructor(owner) {
    this.owner = owner;
    this.flowers = [];
    this.year = new Date().getFullYear();
    this.visitRecords = [];
    this.activeVisitors = [];
  }

  addFlower(flower) {
    this.flowers.push(flower);
  }

  getFlowers() {
    return this.flowers;
  }

  getFlowerById(flowerId) {
    return this.flowers.find((flower) => flower.id === flowerId) || null;
  }

  removeFlowerById(flowerId) {
    const index = this.flowers.findIndex((flower) => flower.id === flowerId);

    if (index === -1) {
      return null;
    }

    const removedFlower = this.flowers[index];
    this.flowers.splice(index, 1);
    return removedFlower;
  }

  addVisitRecord(record) {
    this.visitRecords.unshift(record);

    if (this.visitRecords.length > 30) {
      this.visitRecords.length = 30;
    }
  }

  getVisitRecords() {
    return this.visitRecords;
  }

  startActiveVisit(visitorInfo) {
    const existing = this.activeVisitors.find(
      (visitor) => visitor.visitorId === visitorInfo.visitorId
    );

    if (existing) {
      existing.x = visitorInfo.x;
      existing.y = visitorInfo.y;
      existing.avatar = visitorInfo.avatar;
      existing.name = visitorInfo.name;
      return;
    }

    this.activeVisitors.push(visitorInfo);
  }

  moveActiveVisit(visitorId, x, y) {
    const existing = this.activeVisitors.find(
      (visitor) => visitor.visitorId === visitorId
    );

    if (!existing) {
      return false;
    }

    existing.x = x;
    existing.y = y;
    return true;
  }

  endActiveVisit(visitorId) {
    this.activeVisitors = this.activeVisitors.filter(
      (visitor) => visitor.visitorId !== visitorId
    );
  }

  getActiveVisitors() {
    return this.activeVisitors;
  }
}

export default Garden;