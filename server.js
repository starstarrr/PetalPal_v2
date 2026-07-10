import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

import prisma from "./lib/prisma.js";
import { createFlower } from "./logic/gardenLogic.js";
import { predictMood, loadMoodModel } from "./moodClassifier.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const activeVisitorsByGarden = {};
 
function getActiveVisitors(gardenId) {
  return activeVisitorsByGarden[gardenId] || [];
}

function setActiveVisitors(gardenId, visitors) {
  activeVisitorsByGarden[gardenId] = visitors;
}

async function getUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      garden: {
        include: {
          flowers: {
            include: {
              messages: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          visitRecords: {
            orderBy: {
              createdAt: "desc",
            },
            take: 30,
          },
        },
      },
    },
  });
}

async function ensureGarden(userId) {
  let garden = await prisma.garden.findUnique({
    where: { ownerId: userId },
  });

  if (!garden) {
    garden = await prisma.garden.create({
      data: {
        ownerId: userId,
        year: new Date().getFullYear(),
      },
    });
  }

  return garden;
}

async function getGardenResponse(userId) {
  const user = await getUser(userId);

  if (!user) {
    return null;
  }

  const garden = user.garden || (await ensureGarden(user.id));

  const fullGarden = await prisma.garden.findUnique({
    where: { id: garden.id },
    include: {
      flowers: {
        include: {
          messages: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      visitRecords: {
        orderBy: {
          createdAt: "desc",
        },
        take: 30,
      },
    },
  });

  return {
    owner: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
    },
    flowers: fullGarden.flowers,
    visitRecords: fullGarden.visitRecords,
    activeVisitors: getActiveVisitors(fullGarden.id),
  };
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(users);
  } catch (err) {
    console.error("GET /users error:", err);
    res.status(500).json({ error: "Failed to get users" });
  }
});

app.get("/users/search", async (req, res) => {
    try {
      const name = (req.query.name || "").trim();
      const currentUserId = req.query.currentUserId;
  
      if (!name) {
        return res.json([]);
      }
  
      const users = await prisma.user.findMany({
        where: {
          id: {
            not: currentUserId
          },
  
          name: {
            contains: name,
            mode: "insensitive"
          }
        },
  
        select: {
          id: true,
          name: true,
          avatar: true
        },
  
        orderBy: {
          name: "asc"
        }
      });
  
      res.json(users);
  
    } catch (err) {
  
      console.error("Search user error:", err);
  
      res.status(500).json({
        error: "Failed to search users"
      });
    }
  });

app.get("/users/:userId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.userId,
      },
      include: {
        friends: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      friends: user.friends.map((friendship) => friendship.friendId),
    });
  } catch (err) {
    console.error("GET /users/:userId error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

app.get("/users/:userId/friends", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.userId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        userId: user.id,
      },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    res.json(friendships.map((item) => item.friend));
  } catch (err) {
    console.error("GET /users/:userId/friends error:", err);
    res.status(500).json({ error: "Failed to get friends" });
  }
});

app.get("/users/:userId/garden", async (req, res) => {
  try {
    const gardenResponse = await getGardenResponse(req.params.userId);

    if (!gardenResponse) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(gardenResponse);
  } catch (err) {
    console.error("GET /users/:userId/garden error:", err);
    res.status(500).json({ error: "Failed to get garden" });
  }
});
app.post("/register", async (req, res) => {
    try {
      const { name, email, password, avatar } = req.body;
  
      if (!name || !email || !password) {
        return res.status(400).json({
          error: "Name, email and password are required"
        });
      }
  
      const normalizedEmail = email.trim().toLowerCase();
  
      if (password.length < 6) {
        return res.status(400).json({
          error: "Password must be at least 6 characters"
        });
      }
  
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            {
              name: {
                equals: name.trim(),
                mode: "insensitive"
              }
            }
          ]
        }
      });
  
      if (existingUser) {
        return res.status(400).json({
          error: "Email or username already exists"
        });
      }
  
      const passwordHash = await bcrypt.hash(password, 12);
  
      const id = `user_${Date.now()}`;
      const accountId = `PP${Date.now().toString().slice(-8)}`;
  
      const user = await prisma.user.create({
        data: {
          id,
          accountId,
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          avatar: avatar || "🦋",
          garden: {
            create: {
              year: new Date().getFullYear()
            }
          }
        },
        select: {
          id: true,
          accountId: true,
          name: true,
          email: true,
          avatar: true
        }
      });
  
      res.status(201).json(user);
    } catch (err) {
      console.error("REGISTER error:", err);
      res.status(500).json({
        error: "Failed to register"
      });
    }
  });

  app.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({
          error: "Email and password are required"
        });
      }
  
      const normalizedEmail = email.trim().toLowerCase();
  
      const user = await prisma.user.findUnique({
        where: {
          email: normalizedEmail
        }
      });
  
      if (!user || !user.passwordHash) {
        return res.status(401).json({
          error: "Invalid email or password"
        });
      }
  
      const passwordMatches = await bcrypt.compare(
        password,
        user.passwordHash
      );
  
      if (!passwordMatches) {
        return res.status(401).json({
          error: "Invalid email or password"
        });
      }
  
      res.json({
        id: user.id,
        accountId: user.accountId,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      });
    } catch (err) {
      console.error("LOGIN error:", err);
      res.status(500).json({
        error: "Failed to log in"
      });
    }
  });

app.post("/users", async (req, res) => {
  try {
    const { name, avatar } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const trimmedName = name.trim();

    const nameExists = await prisma.user.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: "insensitive",
        },
      },
    });

    if (nameExists) {
      return res.status(400).json({ error: "Name already exists" });
    }

    const newUserId = `user_${Date.now()}`;

    const newUser = await prisma.user.create({
      data: {
        id: newUserId,
        name: trimmedName,
        avatar: avatar || "🦋",
        garden: {
          create: {
            year: new Date().getFullYear(),
          },
        },
      },
    });

    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      avatar: newUser.avatar,
      friends: [],
    });
  } catch (err) {
    console.error("POST /users error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/friends/add", async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (userId === friendId) {
      return res.status(400).json({ error: "You cannot add yourself" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const friend = await prisma.user.findUnique({ where: { id: friendId } });

    if (!user || !friend) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.friendship.upsert({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
      update: {},
      create: {
        userId,
        friendId,
      },
    });

    await prisma.friendship.upsert({
      where: {
        userId_friendId: {
          userId: friendId,
          friendId: userId,
        },
      },
      update: {},
      create: {
        userId: friendId,
        friendId: userId,
      },
    });

    const userFriends = await prisma.friendship.findMany({
      where: { userId },
      select: { friendId: true },
    });

    const friendFriends = await prisma.friendship.findMany({
      where: { userId: friendId },
      select: { friendId: true },
    });

    res.json({
      success: true,
      message: "Friend added successfully",
      userFriends: userFriends.map((item) => item.friendId),
      friendFriends: friendFriends.map((item) => item.friendId),
    });
  } catch (err) {
    console.error("POST /friends/add error:", err);
    res.status(500).json({ error: "Failed to add friend" });
  }
});

app.post("/friends/remove", async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    res.json({
      success: true,
      message: "Friend removed successfully",
      userFriends: [],
      friendFriends: [],
    });
  } catch (err) {
    console.error("POST /friends/remove error:", err);
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

app.post("/users/:userId/flowers", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.userId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { mood, event } = req.body;

    if (!mood) {
      return res.status(400).json({ error: "Mood is required" });
    }

    const garden = await ensureGarden(user.id);

    const existingFlowers = await prisma.flower.findMany({
      where: {
        gardenId: garden.id,
      },
    });

    const tempFlower = createFlower(mood, event, existingFlowers);

    const flower = await prisma.flower.create({
      data: {
        mood: tempFlower.mood,
        event: tempFlower.event || "",
        name: tempFlower.name,
        meaning: tempFlower.meaning,
        img: tempFlower.img,
        left: tempFlower.left,
        top: tempFlower.top,
        supportCount: 0,
        userId: user.id,
        gardenId: garden.id,
      },
      include: {
        messages: true,
      },
    });

    res.status(201).json(flower);
  } catch (err) {
    console.error("POST /users/:userId/flowers error:", err);
    res.status(500).json({ error: "Failed to create flower" });
  }
});

app.post("/users/:userId/flowers/:flowerId/support", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.userId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const flower = await prisma.flower.findFirst({
      where: {
        id: req.params.flowerId,
        userId: user.id,
      },
    });

    if (!flower) {
      return res.status(404).json({ error: "Flower not found" });
    }

    const updatedFlower = await prisma.flower.update({
      where: {
        id: flower.id,
      },
      data: {
        supportCount: {
          increment: 1,
        },
      },
      include: {
        messages: true,
      },
    });

    res.json(updatedFlower);
  } catch (err) {
    console.error("POST /support error:", err);
    res.status(500).json({ error: "Failed to support flower" });
  }
});

app.post("/users/:userId/flowers/:flowerId/message", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.userId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { author, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const flower = await prisma.flower.findFirst({
      where: {
        id: req.params.flowerId,
        userId: user.id,
      },
    });

    if (!flower) {
      return res.status(404).json({ error: "Flower not found" });
    }

    await prisma.message.create({
      data: {
        author: author || "Friend",
        text: text.trim(),
        flowerId: flower.id,
        userId: user.id,
      },
    });

    const updatedFlower = await prisma.flower.findUnique({
      where: {
        id: flower.id,
      },
      include: {
        messages: true,
      },
    });

    res.json(updatedFlower);
  } catch (err) {
    console.error("POST /message error:", err);
    res.status(500).json({ error: "Failed to add message" });
  }
});

app.delete("/users/:userId/flowers/:flowerId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.userId,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const flower = await prisma.flower.findFirst({
      where: {
        id: req.params.flowerId,
        userId: user.id,
      },
    });

    if (!flower) {
      return res.status(404).json({ error: "Flower not found" });
    }

    await prisma.message.deleteMany({
      where: {
        flowerId: flower.id,
      },
    });

    const removedFlower = await prisma.flower.delete({
      where: {
        id: flower.id,
      },
    });

    res.json({
      success: true,
      message: "Flower deleted successfully",
      deletedFlower: removedFlower,
    });
  } catch (err) {
    console.error("DELETE /flowers error:", err);
    res.status(500).json({ error: "Failed to delete flower" });
  }
});

app.post("/visit", async (req, res) => {
  try {
    const {
      hostUserId,
      visitorUserId,
      visitorAvatar,
      x = 120,
      y = 520,
    } = req.body;

    const host = await prisma.user.findUnique({
      where: {
        id: hostUserId,
      },
    });

    const visitor = await prisma.user.findUnique({
      where: {
        id: visitorUserId,
      },
    });

    if (!host || !visitor) {
      return res.status(404).json({ error: "User not found" });
    }

    const hostGarden = await ensureGarden(host.id);

    const visitors = getActiveVisitors(hostGarden.id);
    const existing = visitors.find((item) => item.visitorId === visitor.id);

    if (existing) {
      existing.x = x;
      existing.y = y;
      existing.avatar = visitorAvatar || visitor.avatar;
      existing.name = visitor.name;
    } else {
      visitors.push({
        visitorId: visitor.id,
        name: visitor.name,
        avatar: visitorAvatar || visitor.avatar,
        x,
        y,
      });
    }

    setActiveVisitors(hostGarden.id, visitors);

    await prisma.visitRecord.create({
      data: {
        visitorId: visitor.id,
        visitorName: visitor.name,
        visitorAvatar: visitorAvatar || visitor.avatar,
        action: "started visiting your garden",
        gardenId: hostGarden.id,
        userId: visitor.id,
      },
    });

    const visitRecords = await prisma.visitRecord.findMany({
      where: {
        gardenId: hostGarden.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    });

    res.json({
      success: true,
      activeVisitors: getActiveVisitors(hostGarden.id),
      visitRecords,
    });
  } catch (err) {
    console.error("POST /visit error:", err);
    res.status(500).json({ error: "Failed to visit garden" });
  }
});

app.post("/visit/move", async (req, res) => {
  try {
    const { hostUserId, visitorUserId, x, y, visitorAvatar } = req.body;

    if (typeof x !== "number" || typeof y !== "number") {
      return res.status(400).json({ error: "x and y must be numbers" });
    }

    const host = await prisma.user.findUnique({
      where: {
        id: hostUserId,
      },
    });

    const visitor = await prisma.user.findUnique({
      where: {
        id: visitorUserId,
      },
    });

    if (!host || !visitor) {
      return res.status(404).json({ error: "User not found" });
    }

    const hostGarden = await ensureGarden(host.id);
    const visitors = getActiveVisitors(hostGarden.id);

    const activeVisitor = visitors.find(
      (item) => item.visitorId === visitorUserId
    );

    if (!activeVisitor) {
      return res.status(404).json({ error: "Visitor not active in this garden" });
    }

    activeVisitor.x = x;
    activeVisitor.y = y;

    if (visitorAvatar) {
      activeVisitor.avatar = visitorAvatar;
    }

    setActiveVisitors(hostGarden.id, visitors);

    res.json({
      success: true,
      activeVisitors: getActiveVisitors(hostGarden.id),
    });
  } catch (err) {
    console.error("POST /visit/move error:", err);
    res.status(500).json({ error: "Failed to move visitor" });
  }
});

app.post("/leave", async (req, res) => {
  try {
    const { hostUserId, visitorUserId, visitorAvatar } = req.body;

    const host = await prisma.user.findUnique({
      where: {
        id: hostUserId,
      },
    });

    const visitor = await prisma.user.findUnique({
      where: {
        id: visitorUserId,
      },
    });

    if (!host || !visitor) {
      return res.status(404).json({ error: "User not found" });
    }

    const hostGarden = await ensureGarden(host.id);

    const visitors = getActiveVisitors(hostGarden.id).filter(
      (item) => item.visitorId !== visitor.id
    );

    setActiveVisitors(hostGarden.id, visitors);

    await prisma.visitRecord.create({
      data: {
        visitorId: visitor.id,
        visitorName: visitor.name,
        visitorAvatar: visitorAvatar || visitor.avatar,
        action: "left your garden",
        gardenId: hostGarden.id,
        userId: visitor.id,
      },
    });

    const visitRecords = await prisma.visitRecord.findMany({
      where: {
        gardenId: hostGarden.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    });

    res.json({
      success: true,
      activeVisitors: getActiveVisitors(hostGarden.id),
      visitRecords,
    });
  } catch (err) {
    console.error("POST /leave error:", err);
    res.status(500).json({ error: "Failed to leave garden" });
  }
});

app.post("/analyze-mood", async (req, res) => {
  try {
    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const mood = await predictMood(text);
    res.json({ mood });
  } catch (err) {
    console.error("Mood analysis error:", err);
    res.status(500).json({ error: "Failed to analyze mood" });
  }
});

app.delete("/users/:id", async (req, res) => {
    try {
      const id = req.params.id;
  
      const user = await prisma.user.findUnique({
        where: { id }
      });
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      await prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId: id },
            { friendId: id }
          ]
        }
      });
  
      const garden = await prisma.garden.findUnique({
        where: {
          ownerId: id
        }
      });
  
      if (garden) {
        const flowers = await prisma.flower.findMany({
          where: {
            gardenId: garden.id
          },
          select: {
            id: true
          }
        });
  
        const flowerIds = flowers.map((flower) => flower.id);
  
        if (flowerIds.length > 0) {
          await prisma.message.deleteMany({
            where: {
              flowerId: {
                in: flowerIds
              }
            }
          });
  
          await prisma.flower.deleteMany({
            where: {
              id: {
                in: flowerIds
              }
            }
          });
        }
  
        await prisma.visitRecord.deleteMany({
          where: {
            gardenId: garden.id
          }
        });
  
        await prisma.garden.delete({
          where: {
            id: garden.id
          }
        });
      }
  
      await prisma.visitRecord.deleteMany({
        where: {
          visitorId: id
        }
      });
  
      await prisma.message.deleteMany({
        where: {
          userId: id
        }
      });
  
      await prisma.user.delete({
        where: {
          id
        }
      });
  
      res.json({
        success: true,
        message: "User deleted successfully"
      });
    } catch (err) {
      console.error("DELETE /users/:id error:", err);
      res.status(500).json({
        error: err.message || "Failed to delete user"
      });
    }
  });

loadMoodModel()
  .then(() => {
    console.log("Mood model loaded.");
  })
  .catch((err) => {
    console.error("Failed to load mood model:", err);
  });

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});