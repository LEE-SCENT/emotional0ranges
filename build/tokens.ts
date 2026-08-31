// 자동 생성 파일입니다. 직접 수정하지 말고 tokens/*.json 을 고친 뒤 `node scripts/build-tokens.mjs` 를 실행하세요.

/**
 * @internal 디자인 시스템 내부용입니다. 화면 작업에서는 semantic / typography 를 쓰세요.
 */
export const primitive = {
  "colors": {
    "black": "#000000",
    "white": "#FFFFFF",
    "whiteAlpha": {
      "15": "#FFFFFF26",
      "85": "#FFFFFFD9",
      "90": "#FFFFFFE6"
    },
    "twistOrange": {
      "50": "#FAE9E6",
      "100": "#FDCCBA",
      "200": "#FBAC8D",
      "300": "#FA8C60",
      "400": "#F8733C",
      "500": "#F75D15",
      "600": "#EC5711",
      "700": "#DF500B",
      "800": "#D14807",
      "900": "#B83C00",
      "alpha500": {
        "85": "#F75D15D9"
      }
    },
    "seriousGray": {
      "50": "#FDFBFA",
      "100": "#F8F6F5",
      "200": "#F3F1F0",
      "300": "#E7E5E4",
      "400": "#C5C3C2",
      "500": "#A6A4A3",
      "600": "#7D7B7A",
      "700": "#686666",
      "800": "#494746",
      "900": "#272625",
      "alpha900": {
        "4": "#2726250A",
        "8": "#27262514",
        "25": "#27262540"
      }
    },
    "casualNeutral": {
      "50": "#EBE6E2",
      "100": "#CBC0B9",
      "200": "#A8978D"
    },
    "accentRed": {
      "50": "#FFEBEF",
      "500": "#FF383C"
    },
    "accentGreen": {
      "50": "#E5F7E8",
      "400": "#34C759",
      "500": "#00BC37"
    },
    "accentBlue": {
      "400": "#195EFF"
    }
  },
  "dimension": "4px",
  "duration": {
    "fast": "120ms",
    "base": "240ms",
    "slow": "400ms"
  },
  "easing": {
    "standard": "cubic-bezier(0.2, 0, 0, 1)",
    "decelerate": "cubic-bezier(0, 0, 0, 1)",
    "accelerate": "cubic-bezier(0.3, 0, 1, 1)"
  },
  "rounded": {
    "xs": "4px",
    "s": "6px",
    "m": "8px",
    "l": "12px",
    "xl": "16px",
    "2xl": "20px",
    "full": "9999px"
  },
  "fontFamily": {
    "pretendard": [
      "Pretendard Variable",
      "Pretendard",
      "-apple-system",
      "BlinkMacSystemFont",
      "system-ui",
      "Roboto",
      "Helvetica Neue",
      "Segoe UI",
      "Apple SD Gothic Neo",
      "Noto Sans KR",
      "Malgun Gothic",
      "sans-serif"
    ]
  },
  "fontSize": {
    "100": "10px",
    "150": "12px",
    "250": "14px",
    "350": "16px",
    "500": "20px",
    "700": "24px",
    "750": "28px",
    "800": "32px",
    "900": "36px",
    "1050": "44px",
    "1150": "52px"
  },
  "fontWeight": {
    "regular-400": 400,
    "medium-500": 500,
    "semibold-600": 600
  },
  "lineHeight": {
    "110": "110%",
    "130": "130%",
    "140": "140%",
    "150": "150%"
  },
  "letterSpacing": {
    "0": "0em",
    "n2": "-0.02em",
    "n3": "-0.03em"
  }
} as const

/** typography 를 제외한 semantic 토큰 (spacing 등). */
export const semantic = {
  "colors": {
    "bg": "#FFFFFF",
    "bg-low": "#F8F6F5",
    "bg-disabled": "#FDFBFA",
    "bg-transparent": "#27262514",
    "bg-brand": "#F75D15",
    "bg-contrast": "#000000",
    "bg-critical": "#FFEBEF",
    "fg": "#000000",
    "fg-low": "#686666",
    "fg-lower": "#7D7B7A",
    "fg-lowest": "#A6A4A3",
    "fg-disabled": "#C5C3C2",
    "fg-brand": "#F75D15",
    "fg-contrast": "#FFFFFF",
    "fg-success": "#34C759",
    "fg-critical": "#FF383C",
    "border": "#E7E5E4",
    "divider": "#E7E5E4",
    "divider-low": "#F3F1F0"
  },
  "breakpoint": {
    "sm": "441px",
    "md": "961px",
    "lg": "1601px"
  },
  "container": {
    "gutter": {
      "base": "20px",
      "md": "24px"
    },
    "maxWidth": {
      "md": "1280px",
      "lg": "1280px",
      "wide": "1600px"
    }
  },
  "spacing": {
    "50": "2px",
    "100": "4px",
    "150": "6px",
    "200": "8px",
    "250": "10px",
    "300": "12px",
    "400": "16px",
    "500": "20px",
    "600": "24px",
    "700": "28px",
    "800": "32px",
    "900": "36px",
    "1000": "40px",
    "1200": "48px",
    "1500": "60px",
    "1800": "72px",
    "2000": "80px",
    "2200": "88px",
    "2400": "96px",
    "3000": "120px",
    "3200": "128px",
    "4000": "160px",
    "4500": "180px"
  }
} as const

export const typography = {
  "display-xl-semibold": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "52px",
    "fontWeight": 600,
    "lineHeight": "130%",
    "letterSpacing": "-0.02em"
  },
  "display-m-semibold": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "44px",
    "fontWeight": 600,
    "lineHeight": "130%",
    "letterSpacing": "-0.02em"
  },
  "display-s-semibold": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "32px",
    "fontWeight": 600,
    "lineHeight": "130%",
    "letterSpacing": "-0.02em"
  },
  "heading-l-semibold": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "36px",
    "fontWeight": 600,
    "lineHeight": "110%",
    "letterSpacing": "0em"
  },
  "heading-m-semibold": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "28px",
    "fontWeight": 600,
    "lineHeight": "130%",
    "letterSpacing": "0em"
  },
  "heading-s-semibold": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "24px",
    "fontWeight": 600,
    "lineHeight": "140%",
    "letterSpacing": "0em"
  },
  "heading-xs-semibold": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "20px",
    "fontWeight": 600,
    "lineHeight": "140%",
    "letterSpacing": "0em"
  },
  "heading-xs-medium": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "20px",
    "fontWeight": 500,
    "lineHeight": "140%",
    "letterSpacing": "0em"
  },
  "body-xl-semibold": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "20px",
    "fontWeight": 600,
    "lineHeight": "140%",
    "letterSpacing": "0em"
  },
  "body-xl-medium": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "20px",
    "fontWeight": 500,
    "lineHeight": "140%",
    "letterSpacing": "0em"
  },
  "body-l-semibold": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "16px",
    "fontWeight": 600,
    "lineHeight": "150%",
    "letterSpacing": "0em"
  },
  "body-l-medium": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "16px",
    "fontWeight": 500,
    "lineHeight": "150%",
    "letterSpacing": "0em"
  },
  "body-l-regular": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "16px",
    "fontWeight": 400,
    "lineHeight": "150%",
    "letterSpacing": "0em"
  },
  "body-m-semibold": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "14px",
    "fontWeight": 600,
    "lineHeight": "140%",
    "letterSpacing": "0em"
  },
  "body-m-medium": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "14px",
    "fontWeight": 500,
    "lineHeight": "140%",
    "letterSpacing": "0em"
  },
  "body-m-regular": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "14px",
    "fontWeight": 400,
    "lineHeight": "140%",
    "letterSpacing": "0em"
  },
  "body-s-semibold": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "12px",
    "fontWeight": 600,
    "lineHeight": "130%",
    "letterSpacing": "0em"
  },
  "body-s-medium": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "12px",
    "fontWeight": 500,
    "lineHeight": "130%",
    "letterSpacing": "0em"
  },
  "body-s-regular": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "12px",
    "fontWeight": 400,
    "lineHeight": "130%",
    "letterSpacing": "0em"
  },
  "body-xs-semibold": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "10px",
    "fontWeight": 600,
    "lineHeight": "140%",
    "letterSpacing": "0em"
  },
  "body-xs-medium": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "10px",
    "fontWeight": 500,
    "lineHeight": "140%",
    "letterSpacing": "0em"
  },
  "body-xs-regular": {
    "fontFamily": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, \"Helvetica Neue\", \"Segoe UI\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif",
    "fontSize": "10px",
    "fontWeight": 400,
    "lineHeight": "140%",
    "letterSpacing": "0em"
  }
} as const

/**
 * @internal 컴포넌트 구현 전용입니다. 화면 작업에서는 semantic / typography 를 쓰세요.
 */
export const components = {
  "alertBanner": {
    "bg": "#f75d151a",
    "fg": "#F75D15",
    "rounded": "8px",
    "iconSize": "20px",
    "paddingBlock": "4px",
    "paddingInline": "4px",
    "gap": "4px"
  },
  "appBar": {
    "bg": "#FFFFFF",
    "fg": "#686666",
    "fgActive": "#F75D15",
    "iconSize": "24px",
    "itemMinWidth": "56px",
    "minWidth": "360px",
    "height": "56px",
    "topLine": "#0000000D"
  },
  "badge": {
    "bg": "#F75D15",
    "border": "#FFFFFF",
    "size": {
      "m": "8px",
      "l": "10px"
    },
    "borderWidth": {
      "m": "1px",
      "l": "2px"
    }
  },
  "bottomCta": {
    "height": "72px",
    "paddingBlock": "4px",
    "paddingInline": "4px",
    "bg": "#FFFFFF",
    "border": "#0000000d"
  },
  "button": {
    "filled": {
      "disabledOpacity": 0.25,
      "fg": "#FFFFFF",
      "bg": "#000000",
      "fg-on": "#000000",
      "bg-on": "#FFFFFF"
    },
    "outlined": {
      "fg": "#272625",
      "bg": "#FFFFFF",
      "border": "#E7E5E4",
      "fg-on": "#FFFFFF",
      "border-on": "#E7E5E4"
    },
    "ghost": {
      "fg": "#686666",
      "fg-on": "#FFFFFF"
    },
    "blur": {
      "fg": "#494746",
      "bg": "#2726250A",
      "fg-on": "#FFFFFF",
      "bg-on": "#FFFFFF26"
    },
    "rounded": "9999px",
    "iconSize": {
      "xs": "16px",
      "s": "20px",
      "m": "24px",
      "l": "28px"
    },
    "borderWidth": "1px",
    "blurRadius": "7.5px"
  },
  "confirm": {
    "width": "440px",
    "padding": "4px",
    "gap": "4px",
    "textGap": "4px",
    "actionGap": "4px",
    "rounded": "20px",
    "bg": "#FFFFFF",
    "backdrop": "#00000040",
    "shadow": "0 -4px 24px #0000001a"
  },
  "control": {
    "size": "24px",
    "iconSize": "20px",
    "rounded": "4px",
    "borderWidth": "2px",
    "bg": "#FFFFFF",
    "border": "#E7E5E4",
    "bgChecked": "#000000",
    "fgChecked": "#FFFFFF"
  },
  "footer": {
    "snsIconSize": "20px"
  },
  "genderIndicator": {
    "male": "#195EFF",
    "female": "#F75D15",
    "size": "6px"
  },
  "gnb": {
    "fg": "#000000",
    "maxContentWidth": "1280px",
    "maxWidth": "1920px",
    "maxHeight": "72px",
    "logo": {
      "width": "126px",
      "height": "40px",
      "stickyWidth": "96px",
      "stickyHeight": "30px"
    },
    "maxContentWidthLg": "1280px"
  },
  "imageViewer": {
    "maxImageWidth": "1000px",
    "bottomGap": "4px",
    "listMaxWidth": "1280px",
    "listGap": "4px",
    "navGap": "4px",
    "rounded": "20px"
  },
  "kv": {
    "rounded": {
      "base": "12px",
      "md": "20px"
    },
    "scrim": "#27262514",
    "minHeight": {
      "base": "534px",
      "sm": "616px",
      "md": "518px"
    },
    "slide": {
      "gap": "4px",
      "scaleIdle": 0.882
    }
  },
  "notice": {
    "bg": "#F8F6F5",
    "iconSize": "32px",
    "iconFg": "#F75D15"
  },
  "optionCard": {
    "bg": "#FFFFFF",
    "border": "#E7E5E4",
    "borderSelected": "#272625",
    "borderWidth": "1px",
    "borderWidthSelected": "2px",
    "statusIconSize": "16px",
    "rounded": "12px",
    "priceFg": "#F75D15",
    "priceStrikeFg": "#A6A4A3",
    "bgSoldout": "#F8F6F5",
    "fgSoldout": "#C5C3C2",
    "fgWait": "#F75D15",
    "soldoutOpacity": 0.3,
    "height": "92px"
  },
  "participant": {
    "bg": "#F8F6F5",
    "fg": "#000000",
    "separator": "#E7E5E4",
    "separatorHeight": "14px",
    "rounded": "12px",
    "iconSize": "20px",
    "modalWidth": "600px",
    "colGap": "4px",
    "itemGap": "4px"
  },
  "productCard": {
    "rounded": "12px",
    "imageRatio": 1.4444,
    "minWidth": "312px",
    "scrim": {
      "from": "#000000A6",
      "height": "160px"
    },
    "status": {
      "bg": "#00000099",
      "fgRemaining": "#F75D15",
      "fgClosed": "#FFFFFF",
      "blurRadius": "12px"
    },
    "more": {
      "fg": "#686666",
      "minWidth": "108px"
    },
    "category": {
      "imageRatio": 1,
      "width": "198px",
      "minWidth": "108px",
      "gap": "4px",
      "scrim": {
        "from": "#00000066",
        "height": "80px"
      }
    },
    "promotion": {
      "gap": "4px",
      "columns": 3,
      "mainRatio": 1.4975,
      "tint": "#00000033",
      "scrim": {
        "from": "#000000E6",
        "height": "160px"
      },
      "moreIconSize": "24px",
      "moreFg": "#FFFFFF",
      "locked": {
        "fg": "#7D7B7A"
      }
    }
  },
  "review": {
    "starFg": "#F75D15",
    "starEmptyFg": "#E7E5E4",
    "starSize": "14px",
    "symbolSize": "42px"
  },
  "sectionTitle": {
    "fg": "#000000",
    "fgDescription": "#7D7B7A"
  },
  "segmentedControl": {
    "bg": "#FFFFFFE6",
    "border": "#27262514",
    "rounded": "9999px",
    "borderWidth": "1px",
    "transition": {
      "duration": "240ms",
      "easing": "cubic-bezier(0.2, 0, 0, 1)"
    },
    "item": {
      "fg": "#494746",
      "fg-disabled": "#C5C3C2",
      "fg-active": "#FFFFFF",
      "bg-active": "#F75D15",
      "rounded": "9999px"
    }
  },
  "sheet": {
    "backdrop": "#00000040",
    "bg": "#FFFFFF",
    "rounded": "20px",
    "modalWidth": "600px",
    "modalMargin": "4px",
    "modalHeaderHeight": "76px",
    "modalPaddingInline": "4px",
    "maxWidth": "480px",
    "maxHeight": "76dvh",
    "paddingBlock": "4px",
    "paddingBlockEnd": "4px",
    "paddingInline": "4px",
    "gap": "4px",
    "modalShadow": "0 12px 32px #0000001f",
    "scrollLine": "#0000000d",
    "shadow": "0 -4px 12px #0000001a"
  },
  "summaryCard": {
    "width": "380px",
    "bg": "#FFFFFF",
    "border": "#E7E5E4",
    "rounded": "20px",
    "padding": "4px",
    "gap": "4px",
    "thumbnailSize": "108px",
    "thumbnailRounded": "12px",
    "divider": "#F3F1F0",
    "guideIconSize": "16px",
    "guideFg": "#7D7B7A",
    "optionBg": "#F8F6F5",
    "optionRounded": "12px"
  },
  "tabs": {
    "border": "#F3F1F0",
    "item": {
      "fg": "#7D7B7A",
      "fgActive": "#000000",
      "borderActive": "#000000",
      "borderWidth": "2px"
    }
  },
  "tag": {
    "bg": "#FFFFFFD9",
    "fg": "#000000",
    "bgAccentPri": "#F75D15D9",
    "bgAccentSec": "#27262540",
    "fgAccent": "#FFFFFF",
    "rounded": "8px",
    "blurRadius": "12px",
    "bgBlackFrom": "#2A2A2A",
    "bgBlackTo": "#666666",
    "fgBlack": "#EEEEEE",
    "iconSize": "16px"
  },
  "toast": {
    "bg": "#000000D9",
    "fg": "#FFFFFF",
    "fgAccent": "#F75D15",
    "fgCritical": "#FF383C",
    "rounded": "8px",
    "iconSize": "20px",
    "width": "390px",
    "minHeight": "52px",
    "blurRadius": "4px",
    "duration": "2500ms"
  },
  "tooltip": {
    "fg": "#FFFFFF",
    "bg": "#272625",
    "rounded": "8px",
    "arrow": {
      "width": "13px",
      "height": "6px"
    }
  },
  "topBar": {
    "height": "72px",
    "paddingBlock": "4px",
    "paddingInline": "4px",
    "gap": "4px",
    "label": {
      "fg": "#686666"
    }
  }
} as const

export type TypographyToken = keyof typeof typography
export type TypographyStyle = (typeof typography)[TypographyToken]

/** CSS-in-JS 스타일 객체를 돌려줍니다. 예: css(typo('body/1')) */
export function typo(token: TypographyToken): TypographyStyle {
  return typography[token]
}
