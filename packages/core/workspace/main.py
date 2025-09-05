# Initial file for Advanced Social Network Simulator

import random
import networkx as nx

class User:
    def __init__(self, user_id):
        self.user_id = user_id
        self.connections = set()
        self.posts = []

class Post:
    def __init__(self, post_id, author_id, content):
        self.post_id = post_id
        self.author_id = author_id
        self.content = content
        self.likes = 0
        self.comments = []

class SocialNetworkSimulator:
    def __init__(self):
        self.users = {}
        self.posts = {}
        self.next_user_id = 1
        self.next_post_id = 1
        self.graph = nx.Graph()

    def create_user(self):
        user_id = f"user_{self.next_user_id}"
        user = User(user_id)
        self.users[user_id] = user
        self.graph.add_node(user_id)
        self.next_user_id += 1
        return user

    def add_connection(self, user1_id, user2_id):
        if user1_id in self.users and user2_id in self.users:
            self.users[user1_id].connections.add(user2_id)
            self.users[user2_id].connections.add(user1_id)
            self.graph.add_edge(user1_id, user2_id)
            return True
        return False

    def create_post(self, author_id, content):
        if author_id in self.users:
            post_id = f"post_{self.next_post_id}"
            post = Post(post_id, author_id, content)
            self.posts[post_id] = post
            self.users[author_id].posts.append(post_id)
            self.next_post_id += 1
            return post
        return None

    def simulate_interaction(self):
        # Basic simulation: a random user creates a post
        if not self.users:
            return

        author_id = random.choice(list(self.users.keys()))
        content = f"Random post by {author_id} at time {random.randint(1, 100)}"
        self.create_post(author_id, content)
        print(f"User {author_id} created a post: '{content}'")

    def get_network_info(self):
        num_users = len(self.users)
        num_posts = len(self.posts)
        num_connections = self.graph.number_of_edges()
        return {"users": num_users, "posts": num_posts, "connections": num_connections}

# Example Usage (will be moved to a separate simulation script later)
if __name__ == "__main__":
    simulator = SocialNetworkSimulator()

    # Create users
    for _ in range(5):
        simulator.create_user()

    user_ids = list(simulator.users.keys())

    # Add some connections
    simulator.add_connection(user_ids[0], user_ids[1])
    simulator.add_connection(user_ids[0], user_ids[2])
    simulator.add_connection(user_ids[1], user_ids[3])
    simulator.add_connection(user_ids[2], user_ids[4])

    # Simulate some interactions
    for _ in range(3):
        simulator.simulate_interaction()

    print("\nNetwork Information:", simulator.get_network_info())
