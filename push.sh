#!/bin/bash
REMOTE1_NAME="origin"
REMOTE1_URL="https://learn.zone01kisumu.ke/git/aaochieng/social-networkt"

REMOTE2_NAME="backup"
REMOTE2_URL="https://github.com/abrakingoo/social_network"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

ensure_remote() {
    local name=$1
    local url=$2

    if git remote get-url "$name" > /dev/null 2>&1; then
        echo "Remote '$name' already exists."
    else
        echo "Remote '$name' not found. Adding it."
        git remote add "$name" "$url"
    fi
}

push_remote() {
    local name=$1
    echo "Pushing to '$name'..."

    if git ls-remote --exit-code --heads "$name" "$CURRENT_BRANCH" > /dev/null 2>&1; then
        echo "Branch '$CURRENT_BRANCH' already exists on '$name'."
    else
        echo "Branch '$CURRENT_BRANCH' does not exist on '$name'. Setting upstream..."
        git push -u "$name" "$CURRENT_BRANCH"
    fi

    if git push "$name" --all && git push "$name" --tags; then
        echo "Push to '$name' successful."
    else
        echo "⚠️ Push to '$name' failed. Continuing to next remote..."
    fi
}

if [ ! -d .git ]; then
    echo "Not a git repository. Exiting."
    exit 1
fi

ensure_remote "$REMOTE1_NAME" "$REMOTE1_URL"
ensure_remote "$REMOTE2_NAME" "$REMOTE2_URL"

push_remote "$REMOTE1_NAME"
push_remote "$REMOTE2_NAME"

echo "Success!!"
