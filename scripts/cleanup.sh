#!/bin/bash

set -e

image_name="epoxy_image_${SESSION_ID}"
container_name="epoxy_container_${SESSION_ID}"

docker stop "${container_name}" || true
docker rm "${container_name}" || true
#docker rmi "${image_name}" || true