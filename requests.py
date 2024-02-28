import requests
import os

# Set up the GitHub repository dispatch URL
repository_dispatch_url = f"https://api.github.com/repos/{os.getenv('zeropse/KnightBot')}/dispatches"

# Trigger the workflow
def trigger_workflow():
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"Bearer {os.getenv('GITHUB_TOKEN')}"
    }
    payload = {
        "event_type": "discord_event"
    }
    response = requests.post(repository_dispatch_url, headers=headers, json=payload)
    response.raise_for_status()

# Call the function to trigger the workflow
trigger_workflow()
