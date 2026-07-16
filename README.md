# 🌸 PetalPal

> **A Social Mood Garden Where Emotions Bloom into Flowers**

PetalPal is a full-stack social web application that transforms daily
emotions into flowers in a personal virtual garden. Users can record
their day, grow mood-based flowers, revisit memories through a calendar,
and interact with friends in real time.

------------------------------------------------------------------------

## ✨ Features

-   🌼 Daily mood check-in
-   🌸 Automatic flower generation
-   🗓️ Flower Calendar with date highlighting
-   👥 Friend search and friend request workflow
-   💌 Leave supportive messages on flowers
-   ❤️ Support friends' flowers
-   🦋 Real-time garden visits using Socket.IO
-   📜 Visitor history
-   🔐 Secure authentication with hashed passwords
-   ☁️ Persistent PostgreSQL database

------------------------------------------------------------------------


# 🏗️ System Architecture

``` text
 Browser
 (HTML/CSS/JavaScript)
          │
          │ REST API + Socket.IO
          ▼
   Express.js Server
          │
          ▼
      Prisma ORM
          │
          ▼
     PostgreSQL
```

------------------------------------------------------------------------

# ⚡ Real-Time Workflow

``` text
User A
   │
Send Friend Request
   │
Express API
   │
Store Request
   │
Socket.IO Event
   │
User B

Accept Request

↓

Friendship Created

↓

Both Clients Updated
```

------------------------------------------------------------------------

# 🗄️ Database Design

``` text
User
├── Garden
│    └── Flower
│          └── Message
├── Friendship
├── FriendRequest
└── VisitRecord
```

------------------------------------------------------------------------

# 🛠️ Tech Stack

  Layer             Technology
  ----------------- -------------------------
  Frontend          HTML5, CSS3, JavaScript
  Backend           Node.js, Express
  Database          PostgreSQL
  ORM               Prisma
  Real-time         Socket.IO
  Authentication    bcrypt
  Mood Analysis     natural.js
  Deployment        Render
  Version Control   Git & GitHub

------------------------------------------------------------------------

# 📂 Project Structure

``` text
PetalPal/
├── prisma/
├── public/
│   ├── main.js
│   ├── login.js
│   ├── friends.js
│   ├── renderGarden.js
│   ├── interactions.js
│   ├── visitors.js
│   ├── style.css
│   └── index.html
├── server.js
├── package.json
└── README.md
```

------------------------------------------------------------------------

# 🚀 Getting Started

``` bash
git clone <repository-url>

cd PetalPal

npm install

npx prisma generate

npx prisma db push

npm start
```

Open:

``` text
http://localhost:3000
```

------------------------------------------------------------------------

# 🌍 Deployment

PetalPal is deployed with:

-   Render
-   PostgreSQL
-   Prisma ORM

------------------------------------------------------------------------

# ⭐ Engineering Highlights

-   Designed a normalized PostgreSQL schema with Prisma ORM.
-   Built RESTful APIs using Express.
-   Implemented real-time synchronization with Socket.IO.
-   Developed a friend request workflow with live updates.
-   Implemented partial UI updates to reduce unnecessary rendering.
-   Created an interactive flower calendar for memory exploration.
-   Structured the application into reusable frontend modules.

------------------------------------------------------------------------

# 🔮 Future Improvements

-   Docker support
-   Jest unit testing
-   Swagger API documentation
-   Notification center
-   Online presence indicators
-   Mobile responsive optimization

------------------------------------------------------------------------

# 👩‍💻 Author

**Xingran Ma**

Computer Science Student, University of British Columbia

------------------------------------------------------------------------

If you found this project interesting, feel free to ⭐ the repository!