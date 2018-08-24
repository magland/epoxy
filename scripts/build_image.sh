#!/bin/bash

set -e

image_name="epoxy_image_${SESSION_ID}"
container_name="epoxy_container_${SESSION_ID}"

if [[ "${EPOXY_HAS_DOCKERFILE}" == "true" ]]; then
	cd "${SOURCE_DIRECTORY}"
	docker build -t "${image_name}" .
else
	cd "${BUILD_DIR}"
	docker build -t "${image_name}" .
fi
