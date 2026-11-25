import { describe, expect, it } from "vitest"
import { parsePerlicaCode, resolvePerlicaUserCode } from "./scan"

describe("parsePerlicaCode", () => {
  it("reads machineNO from the QR link printed on vehicles", () => {
    expect(parsePerlicaCode("http://www.gpsabc.cn/QRcode_xlbcx.html?machineNO=80369677")).toBe(
      "80369677"
    )
  })

  it("continues to support plain codes and existing query parameters", () => {
    expect(parsePerlicaCode("80369677")).toBe("80369677")
    expect(parsePerlicaCode("https://example.invalid/?userCode=80369677")).toBe("80369677")
    expect(parsePerlicaCode("https://example.invalid/?code=80369677")).toBe("80369677")
    expect(parsePerlicaCode("123456789")).toBe("123456789")
  })

  it("rejects nonnumeric and non-body/internally shaped codes", () => {
    expect(parsePerlicaCode("http://www.gpsabc.cn/QRcode_xlbcx.html?machineNO=abc")).toBeNull()
    expect(parsePerlicaCode("1234567")).toBeNull()
    expect(parsePerlicaCode("1234567890")).toBeNull()
  })
})

describe("resolvePerlicaUserCode", () => {
  const machines = [{ userCode: "80369677", machineNo: "123456789" }]

  it("keeps the normal eight-digit body-code flow", () => {
    expect(resolvePerlicaUserCode("80369677", [])).toBe("80369677")
    expect(resolvePerlicaUserCode("80369677", machines)).toBe("80369677")
  })

  it("accepts a nine-digit number only when it maps to a known body code", () => {
    expect(resolvePerlicaUserCode("123456789", machines)).toBe("80369677")
    expect(resolvePerlicaUserCode("123456789", [])).toBeNull()
    expect(
      resolvePerlicaUserCode("123456789", [{ userCode: "", machineNo: "123456789" }])
    ).toBeNull()
  })

  it("rejects codes outside the eight/nine-digit convention", () => {
    expect(resolvePerlicaUserCode("1234567", machines)).toBeNull()
    expect(resolvePerlicaUserCode("1234567890", machines)).toBeNull()
  })
})
