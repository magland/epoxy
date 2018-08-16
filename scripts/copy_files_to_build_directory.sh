#!/bin/bash

set -e

cp ${TEMPLATE_DIR}/Dockerfile ${BUILD_DIR}/
cp -r ${TEMPLATE_DIR}/scripts ${BUILD_DIR}/