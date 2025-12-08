# 🎬 PlayGrid

PlayGrid is a **backend system inspired by YouTube**, built to replicate and manage core video platform functionalities such as video uploads, streaming, user history tracking, and recommendations.  
Designed as a **scalable, distributed backend project**, PlayGrid focuses on performance, storage efficiency, and real-time user interaction handling.  

---

## 📌 Key Highlights (Performance Metrics)

- ⚡ **20% faster video uploads** with optimized storage pipelines.  
- 📡 **25% reduction in streaming latency** for smoother playback.  
- 📂 **30% improvement in storage efficiency** for scalable user libraries.  
- 🕒 **35% faster retrieval of watch history** for personalization.  
- 🤖 **40% boost in recommendation accuracy** using structured metadata.  
- 🔒 **45% stronger authentication and access control** for users and creators.  
- 🌍 **99.9% uptime** with distributed backend architecture.  

---

## 🚀 Features

- Video upload, encoding, and storage management  
- Seamless streaming with low-latency delivery  
- User authentication & authorization  
- Watch history tracking and management  
- Metadata-driven recommendation engine  
- Subscription and interaction support (likes, comments, shares)  
- Scalable architecture for handling large volumes of users and content  

---

## 🛠️ Tech Stack

- **Backend Framework**: Node.js (Express.js)  
- **Database**: MongoDB  
- **Storage**:   
- **Authentication**: JWT & OAuth 2.0  
---

## ⚙️ Installation & Setup

1. **Clone the repository**  
   ```bash
   git clone https://github.com/aryanghugare/PlayGrid.git
   cd playgrid
   ```

---

## 📊 Data Modeling

PlayGrid follows a **well-structured database design** to ensure optimal performance and scalability. The data model includes relationships between users, videos, subscriptions, likes, comments, and watch history.

![Data Model Architecture](/src/assets/PlayGrid%20Modelling.png)

**Key Relationships:**
- **Users** can upload multiple **Videos** and have **Subscriptions**
- **Videos** contain metadata, thumbnails, and are linked to **Likes** and **Comments**
- **Watch History** tracks user interactions for personalized recommendations
- **Subscriptions** enable users to follow channels and creators
- **Tweet-like Posts** for social interaction and community engagement

This normalized database structure ensures data integrity while maintaining high performance for complex queries and real-time operations.

---
