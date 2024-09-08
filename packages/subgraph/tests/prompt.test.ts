import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import { promptRequest } from "../generated/schema"
import { promptRequest as promptRequestEvent } from "../generated/Prompt/Prompt"
import { handlepromptRequest } from "../src/prompt"
import { createpromptRequestEvent } from "./prompt-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let requestId = BigInt.fromI32(234)
    let sender = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let modelId = BigInt.fromI32(234)
    let prompt = "Example string value"
    let newpromptRequestEvent = createpromptRequestEvent(
      requestId,
      sender,
      modelId,
      prompt
    )
    handlepromptRequest(newpromptRequestEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("promptRequest created and stored", () => {
    assert.entityCount("promptRequest", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "promptRequest",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "requestId",
      "234"
    )
    assert.fieldEquals(
      "promptRequest",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "sender",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "promptRequest",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "modelId",
      "234"
    )
    assert.fieldEquals(
      "promptRequest",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "prompt",
      "Example string value"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
