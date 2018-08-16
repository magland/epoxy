#!/bin/bash

set -e

image_name="epoxy_image_${SESSION_ID}"
container_name="epoxy_container_${SESSION_ID}"

cd "${BUILD_DIR}"
docker build -t "${image_name}" .
