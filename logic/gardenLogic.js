import flowerDB from "../data/flowerDB.js";
import Flower from "../models/Flower.js";
import Message from "../models/Message.js";

function getNonOverlappingPosition(existingFlowers) {
  const gardenWidth = 700;
  const flowerWidth = 100;

  const grassStart = 520;
  const grassEnd = 640;

  let left = 0;
  let top = 0;
  let tries = 0;
  let overlapping = true;

  while (overlapping && tries < 100) {
    left = Math.random() * (gardenWidth - flowerWidth);
    top = grassStart + Math.random() * (grassEnd - grassStart);

    overlapping = existingFlowers.some((flower) => {
      const dx = left - flower.left;
      const dy = top - flower.top;
      return Math.abs(dx) < 90 && Math.abs(dy) < 90;
    });

    tries += 1;
  }

  return { left, top };
}

function createFlower(mood, event, existingFlowers) {
  const options = flowerDB[mood] || flowerDB.calm;
  const chosen = options[Math.floor(Math.random() * options.length)];
  const position = getNonOverlappingPosition(existingFlowers);

  return new Flower({
    mood,
    event,
    chosen,
    position
  });
}

function addSupport(flower) {
  flower.addSupport();
  return flower;
}

function addMessage(flower, author, text) {
  const newMessage = new Message(author, text);
  flower.addMessage(newMessage);
  return flower;
}

export { createFlower, addSupport, addMessage };